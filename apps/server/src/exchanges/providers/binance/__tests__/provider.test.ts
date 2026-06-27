import { describe, it, expect, vi, beforeEach } from 'vitest';
import pino from 'pino';
import { BinanceProvider } from '../provider.js';
import type { RestClientTransport } from '../../transport/rest-client.js';
import type { BinanceExchangeInfo, BinanceTicker, BinanceOrderBook, BinanceAccountTradeList } from '../types.js';

class MockTransport implements RestClientTransport {
  request = vi.fn();
}

describe('BinanceProvider', () => {
  let transport: MockTransport;
  let provider: BinanceProvider;
  let logger: pino.Logger;

  beforeEach(() => {
    transport = new MockTransport();
    logger = pino({ level: 'silent' });

    provider = new BinanceProvider(logger, transport as unknown as RestClientTransport, {
      name: 'BINANCE',
      timeoutMs: 1000,
      maxRetries: 1,
      enableWebSocket: false,
    });
  });

  it('connects and loads exchange info', async () => {
    const mockInfo: BinanceExchangeInfo = {
      timezone: 'UTC',
      serverTime: Date.now(),
      symbols: [
        {
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          baseAssetPrecision: 8,
          quotePrecision: 2,
          orderTypes: ['LIMIT', 'MARKET'],
          icebergAllowed: true,
          filters: [],
          permissions: ['SPOT'],
          defaultAccountPermissions: ['TRADING'],
          status: 'TRADING',
        } as any,
      ],
    };

    vi.mocked(transport.request).mockResolvedValueOnce({}); // ping
    vi.mocked(transport.request).mockResolvedValueOnce(mockInfo); // exchangeInfo

    await provider.connect();

    const markets = await provider.getMarkets();
    expect(markets.length).toBe(1);
    expect(markets[0].symbol).toBe('BTCUSDT');
  });

  it('fetches ticker and order book', async () => {
    const mockTicker: BinanceTicker = {
      symbol: 'BTCUSDT',
      priceChange: '100.00',
      priceChangePercent: '1.5',
      weightedAvgPrice: '50000',
      prevClosePrice: '49900',
      lastPrice: '50000',
      lastQty: '0.1',
      bidPrice: '49999.99',
      bidQty: '1.0',
      askPrice: '50000.01',
      askQty: '1.0',
      openPrice: '49900',
      highPrice: '50200',
      lowPrice: '49800',
      volume: '1000',
      quoteAssetVolume: '50000000',
      openTime: 1000,
      closeTime: 2000,
      firstId: 1,
      lastId: 100,
      count: 100,
    };

    const mockOrderBook: BinanceOrderBook = {
      bids: [['49999.99', '1.0']],
      asks: [['50000.01', '1.0']],
      lastUpdateId: 1,
    };

    const mockInfo: BinanceExchangeInfo = {
      timezone: 'UTC',
      serverTime: Date.now(),
      symbols: [
        {
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          baseAssetPrecision: 8,
          quotePrecision: 2,
          orderTypes: ['LIMIT', 'MARKET'],
          icebergAllowed: true,
          filters: [],
          permissions: ['SPOT'],
          defaultAccountPermissions: ['TRADING'],
          status: 'TRADING',
        } as any,
      ],
    };

    // ping, exchangeInfo
    vi.mocked(transport.request).mockResolvedValueOnce({});
    vi.mocked(transport.request).mockResolvedValueOnce(mockInfo);

    // getTicker
    vi.mocked(transport.request).mockResolvedValueOnce(mockTicker);

    // getOrderBook
    vi.mocked(transport.request).mockResolvedValueOnce(mockOrderBook);

    await provider.connect();

    const ticker = await provider.getTicker('BTC/USDT');
    expect(ticker.symbol).toBe('BTC/USDT');
    expect(ticker.price).toBeGreaterThan(0);

    const ob = await provider.getOrderBook('BTC/USDT');
    expect(ob.bids.length).toBe(1);
    expect(ob.asks.length).toBe(1);
  });
});
