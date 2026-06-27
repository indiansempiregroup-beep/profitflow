import { beforeEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import { CoinDCXProvider } from '../provider.js';
import type { RestClientTransport } from '../../../transport/rest-client.js';
import type { CoinDCXExchangeInfo, CoinDCXMarket, CoinDCXOrderBook, CoinDCXTicker, CoinDCXFee } from '../types.js';

class MockTransport implements RestClientTransport {
  request = vi.fn();
}

describe('CoinDCXProvider', () => {
  let transport: MockTransport;
  let provider: CoinDCXProvider;
  let logger: pino.Logger;

  beforeEach(() => {
    transport = new MockTransport();
    logger = pino({ level: 'silent' });
    provider = new CoinDCXProvider(logger, transport as unknown as RestClientTransport, {
      name: 'COINDCX',
      timeoutMs: 1000,
      maxRetries: 1,
      enableWebSocket: false,
    });
  });

  it('connects and loads exchange info', async () => {
    const mockInfo: CoinDCXExchangeInfo = {
      name: 'CoinDCX',
      markets: [
        {
          symbol: 'BTC/INR',
          baseAsset: 'BTC',
          quoteAsset: 'INR',
          minQty: '0.001',
          tickSize: '0.01',
          isActive: true,
        } as CoinDCXMarket,
      ],
      serverTime: Date.now(),
    };

    vi.mocked(transport.request)
      .mockResolvedValueOnce({ data: undefined, status: 200 })
      .mockResolvedValueOnce({ data: mockInfo.markets, status: 200 });

    await provider.connect();

    const markets = await provider.getMarkets();
    expect(markets).toHaveLength(1);
    expect(markets[0].symbol).toBe('BTC/INR');
  });

  it('normalizes ticker and order book responses', async () => {
    const mockTicker: CoinDCXTicker = {
      symbol: 'BTC/INR',
      lastPrice: '5000000',
      volume: '10.5',
      high: '5100000',
      low: '4900000',
      change: '0.02',
      bid: '4999000',
      ask: '5001000',
    };

    const mockOrderBook: CoinDCXOrderBook = {
      symbol: 'BTC/INR',
      bids: [['4999000', '0.1']],
      asks: [['5001000', '0.1']],
    };

    const mockFees: CoinDCXFee[] = [{ symbol: 'BTC/INR', makerFee: '0.001', takerFee: '0.002' }];

    const mockInfo: CoinDCXExchangeInfo = {
      name: 'CoinDCX',
      markets: [
        {
          symbol: 'BTC/INR',
          baseAsset: 'BTC',
          quoteAsset: 'INR',
          minQty: '0.001',
          tickSize: '0.01',
          isActive: true,
        } as CoinDCXMarket,
      ],
      serverTime: Date.now(),
    };

    vi.mocked(transport.request)
      .mockResolvedValueOnce({ data: undefined, status: 200 })
      .mockResolvedValueOnce({ data: mockInfo.markets, status: 200 })
      .mockResolvedValueOnce({ data: mockTicker, status: 200 })
      .mockResolvedValueOnce({ data: mockOrderBook, status: 200 })
      .mockResolvedValueOnce({ data: mockFees, status: 200 });

    await provider.connect();

    const ticker = await provider.getTicker('BTC/INR');
    const orderBook = await provider.getOrderBook('BTC/INR');
    const fees = await provider.getTradingFees();

    expect(ticker.symbol).toBe('BTC/INR');
    expect(orderBook.symbol).toBe('BTC/INR');
    expect(fees[0].symbol).toBe('BTC/INR');
  });
});
