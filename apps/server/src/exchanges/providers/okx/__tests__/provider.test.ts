import { beforeEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import { OKXProvider } from '../provider.js';
import type { RestClientTransport } from '../../../transport/rest-client.js';

class MockTransport implements RestClientTransport {
  request = vi.fn();
}

describe('OKXProvider', () => {
  let transport: MockTransport;
  let provider: OKXProvider;
  let logger: pino.Logger;

  beforeEach(() => {
    transport = new MockTransport();
    logger = pino({ level: 'silent' });
    provider = new OKXProvider(logger, transport as unknown as RestClientTransport, {
      name: 'OKX',
      timeoutMs: 1000,
      maxRetries: 1,
      enableWebSocket: false,
    });
  });

  it('normalizes ticker responses to the shared ticker model', async () => {
    vi.mocked(transport.request).mockResolvedValueOnce({
      data: {
        data: [{ instId: 'BTC-USDT', last: '50000' }],
      },
      status: 200,
    });

    const ticker = await provider.getTicker('BTC/USDT');

    expect(ticker.symbol).toBe('BTC/USDT');
    expect(ticker.price).toBe(50000);
    expect(ticker.exchange).toBe('OKX');
  });
});
