import type { RestClientTransport, RestRequestOptions, RestResponse } from './rest-client';

export class FetchTransport implements RestClientTransport {
  async request<T>(options: RestRequestOptions): Promise<RestResponse<T>> {
    const url = this.buildUrl(options);
    const init: RequestInit = {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined,
    };

    const response = await fetch(url, init);
    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${message}`);
    }

    return {
      status: response.status,
      data: data as T,
    };
  }

  private buildUrl(options: RestRequestOptions): string {
    const baseUrl = options.baseUrl?.replace(/\/+$/, '') ?? '';
    const path = options.path.startsWith('/') ? options.path : `/${options.path}`;
    return `${baseUrl}${path}`;
  }
}
