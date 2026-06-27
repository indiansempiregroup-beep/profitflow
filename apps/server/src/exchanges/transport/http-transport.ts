import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import type { RestClientTransport, RestRequestOptions, RestResponse } from './rest-client.js';

export class HttpTransport implements RestClientTransport {
  async request<T>(options: RestRequestOptions): Promise<RestResponse<T>> {
    const url = this.buildUrl(options);
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === 'https:' ? https : http;
    const body = options.body != null ? JSON.stringify(options.body) : undefined;
    const headers = {
      ...(options.headers ?? {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    };

    return new Promise((resolve, reject) => {
      const request = transport.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: `${parsedUrl.pathname}${parsedUrl.search}`,
          method: options.method ?? 'GET',
          headers,
          timeout: options.timeoutMs ?? 5000,
        },
        (response) => {
          const chunks: Uint8Array[] = [];

          response.on('data', (chunk) => {
            chunks.push(chunk);
          });

          response.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            const contentType = String(response.headers['content-type'] ?? '');
            let data: unknown = raw;

            if (contentType.includes('application/json')) {
              try {
                data = raw ? JSON.parse(raw) : {};
              } catch (error) {
                reject(error);
                return;
              }
            }

            resolve({
              status: response.statusCode ?? 0,
              data: data as T,
            });
          });
        },
      );

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy(new Error('HTTP request timed out'));
      });

      if (body) {
        request.write(body);
      }

      request.end();
    });
  }

  private buildUrl(options: RestRequestOptions): string {
    const baseUrl = options.baseUrl?.replace(/\/+$/, '') ?? '';
    const path = options.path.startsWith('/') ? options.path : `/${options.path}`;
    return `${baseUrl}${path}`;
  }
}
