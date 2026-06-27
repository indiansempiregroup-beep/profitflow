import { createHash } from 'node:crypto';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RestRequestOptions {
  path: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signer?: RequestSigner;
}

export interface RestResponse<T> {
  data: T;
  status: number;
}

export interface RestClientContext {
  attempt: number;
  request: RestRequestOptions;
}

export type RestMiddleware = (context: RestClientContext, next: () => Promise<unknown>) => Promise<unknown>;

export interface RestInterceptor {
  onRequest?: (context: RestClientContext) => Promise<void> | void;
  onResponse?: (context: RestClientContext, response: RestResponse<unknown>) => Promise<void> | void;
  onError?: (context: RestClientContext, error: unknown) => Promise<void> | void;
}

export interface RequestSigner {
  sign(request: RestRequestOptions): Promise<RestRequestOptions> | RestRequestOptions;
}

export interface RestClientTransport {
  request<T>(options: RestRequestOptions): Promise<RestResponse<T>>;
}

export interface RestClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  backoffBaseMs?: number;
  rateLimitPerSecond?: number;
  middleware?: RestMiddleware[];
  interceptors?: RestInterceptor[];
  signer?: RequestSigner;
}

export class RestClient {
  private lastRequestAt = 0;

  constructor(
    private readonly transport: RestClientTransport,
    private readonly options: RestClientOptions = {},
  ) {}

  async request<T>(options: RestRequestOptions): Promise<T> {
    const attempts = this.options.maxRetries ?? 2;
    let lastError: unknown;

    for (let attempt = 0; attempt <= attempts; attempt += 1) {
      try {
        await this.enforceRateLimit();
        const request = await this.prepareRequest(options, attempt);
        const response = await this.executeRequest<T>(request, attempt);
        return response;
      } catch (error) {
        lastError = error;
        if (attempt === attempts) {
          throw error;
        }
        const waitTime = this.calculateBackoff(attempt);
        await this.delay(waitTime);
      }
    }

    throw lastError;
  }

  private async prepareRequest(options: RestRequestOptions, attempt: number): Promise<RestRequestOptions> {
    const request: RestRequestOptions = {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        'Content-Type': 'application/json',
      },
      timeoutMs: options.timeoutMs ?? this.options.timeoutMs ?? 5000,
    };

    const context: RestClientContext = { attempt, request };
    for (const interceptor of this.options.interceptors ?? []) {
      await interceptor.onRequest?.(context);
    }

    if (this.options.signer) {
      const signed = await this.options.signer.sign(request);
      Object.assign(request, signed);
    }

    return request;
  }

  private async executeRequest<T>(request: RestRequestOptions, attempt: number): Promise<T> {
    const context: RestClientContext = { attempt, request };
    const middleware = [...(this.options.middleware ?? [])];

    const run = async (index: number): Promise<unknown> => {
      if (index >= middleware.length) {
        const response = await this.transport.request<T>(request);
        for (const interceptor of this.options.interceptors ?? []) {
          await interceptor.onResponse?.(context, response as RestResponse<unknown>);
        }
        return this.normalizeResponse(response);
      }

      const current = middleware[index];
      return current(context, () => run(index + 1));
    };

    try {
      return (await run(0)) as T;
    } catch (error) {
      for (const interceptor of this.options.interceptors ?? []) {
        await interceptor.onError?.(context, error);
      }
      throw error;
    }
  }

  private normalizeResponse<T>(response: unknown): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as RestResponse<T>).data;
    }

    return response as T;
  }

  private async enforceRateLimit(): Promise<void> {
    const rateLimitPerSecond = this.options.rateLimitPerSecond ?? 5;
    if (rateLimitPerSecond <= 0) {
      return;
    }

    const intervalMs = 1000 / rateLimitPerSecond;
    const now = Date.now();
    const waitTime = Math.max(0, this.lastRequestAt + intervalMs - now);
    if (waitTime > 0) {
      await this.delay(waitTime);
    }
    this.lastRequestAt = Date.now();
  }

  private calculateBackoff(attempt: number): number {
    const base = this.options.backoffBaseMs ?? 100;
    return base * 2 ** attempt;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class NoopRequestSigner implements RequestSigner {
  sign(request: RestRequestOptions): RestRequestOptions {
    return request;
  }
}

export class HeaderRequestSigner implements RequestSigner {
  constructor(
    private readonly apiKey: string,
    private readonly secret: string,
  ) {}

  sign(request: RestRequestOptions): RestRequestOptions {
    const timestamp = Date.now().toString();
    const payload = `${timestamp}${request.method ?? 'GET'}${request.path}`;
    const signature = createHash('sha256').update(`${this.secret}:${payload}`).digest('hex');

    request.headers = {
      ...(request.headers ?? {}),
      'X-API-Key': this.apiKey,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    };

    return request;
  }
}
