import { beforeEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import { CoinDCXRestClient } from '../rest-client.js';
import type { RestClientTransport } from '../../../transport/rest-client.js';
import type { CoinDCXMarket, CoinDCXTicker } from '../types.js';

class MockTransport implements RestClientTransport {
  request = vi.fn();
}

describe('CoinDCXRestClient', () => {
  let transport: MockTransport;
  let client: CoinDCXRestClient;

  beforeEach(() => {
    transport = new MockTransport();
    client = new CoinDCXRestClient(
      pino({ level: 'silent' }),
      transport as unknown as RestClientTransport,
      {
        baseUrl: 'https://api.example.com',
        timeoutMs: 1000,
        maxRetries: 1,
      },
    );
  });

  it('fetches markets from the public endpoint', async () => {
    const markets: CoinDCXMarket[] = [
      {
        symbol: 'BTC/INR',
        baseAsset: 'BTC',
        quoteAsset: 'INR',
        minQty: '0.001',
        tickSize: '0.01',
        isActive: true,
      },
    ];

    vi.mocked(transport.request).mockResolvedValueOnce({ data: markets, status: 200 });

    const result = await client.getMarkets();

    expect(result).toEqual(markets);
    expect(transport.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/exchange/v1/markets_details',
        method: 'GET',
      }),
    );
  });

  it('fetches a ticker and order book for a market', async () => {
    const tickers: CoinDCXTicker[] = [
      {
        market: 'BTC/INR',
        lastPrice: '5000000',
        volume: '10.5',
        high: '5100000',
        low: '4900000',
        change: '0.02',
        bid: '4999000',
        ask: '5001000',
      },
    ];

    vi.mocked(transport.request)
      .mockResolvedValueOnce({ data: tickers, status: 200 })
      .mockResolvedValueOnce({ data: tickers, status: 200 });

    const fetchedTicker = await client.getTicker('BTC/INR');
    const fetchedOrderBook = await client.getOrderBook('BTC/INR', 5);

    expect(fetchedTicker.market).toBe('BTC/INR');
    expect(fetchedOrderBook.symbol).toBe('BTC/INR');
    expect(transport.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/exchange/ticker',
        method: 'GET',
      }),
    );
  });
});
