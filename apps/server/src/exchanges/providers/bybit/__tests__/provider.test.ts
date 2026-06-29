import { beforeEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import { BybitProvider } from '../provider.js';
import type { RestClientTransport } from '../../../transport/rest-client.js';

class MockTransport implements RestClientTransport {
  request = vi.fn();
}

describe('BybitProvider', () => {
  let transport: MockTransport;
  let provider: BybitProvider;
  let logger: pino.Logger;

  beforeEach(() => {
    transport = new MockTransport();
    logger = pino({ level: 'silent' });
    provider = new BybitProvider(logger, transport as unknown as RestClientTransport, {
      name: 'BYBIT',
      timeoutMs: 1000,
      maxRetries: 1,
      enableWebSocket: false,
    });
  });

  it('normalizes ticker responses to the shared ticker model', async () => {
    vi.mocked(transport.request).mockResolvedValueOnce({
      data: { result: { list: [{ symbol: 'BTCUSDT', lastPrice: '50000' }] } },
      status: 200,
    });

    const ticker = await provider.getTicker('BTC/USDT');

    expect(ticker.symbol).toBe('BTC/USDT');
    expect(ticker.price).toBe(50000);
    expect(ticker.exchange).toBe('BYBIT');
  });
});
