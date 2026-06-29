import { describe, it, expect, vi, beforeEach } from 'vitest';
import pino from 'pino';
import { BinanceRestClient } from '../rest-client';
import type { RestClientTransport } from '@exchanges/transport/rest-client';
import type {
  BinanceExchangeInfo,
  BinanceTicker,
  BinanceOrderBook,
  BinanceAccountTradeList,
} from '../types';

describe('BinanceRestClient', () => {
  let mockTransport: RestClientTransport;
  let client: BinanceRestClient;
  let logger: pino.Logger;

  beforeEach(() => {
    logger = pino({ level: 'silent' });

    mockTransport = {
      request: vi.fn(),
    };

    client = new BinanceRestClient(logger, mockTransport, {
      rateLimitPerSecond: 100, // Disable rate limiting for tests
    });
  });

  it('fetches exchange info successfully', async () => {
    const mockData: BinanceExchangeInfo = {
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
        },
      ],
    };

    vi.mocked(mockTransport.request).mockResolvedValue({ data: mockData, status: 200 });

    const info = await client.getExchangeInfo();

    expect(info.symbols.length).toBe(1);
    expect(info.symbols[0].symbol).toBe('BTCUSDT');
    expect(mockTransport.request).toHaveBeenCalled();
  });

  it('fetches single ticker successfully', async () => {
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

    vi.mocked(mockTransport.request).mockResolvedValue({ data: mockTicker, status: 200 });

    const ticker = await client.getTicker('BTCUSDT');

    expect(ticker.symbol).toBe('BTCUSDT');
    expect(ticker.lastPrice).toBe('50000');
  });

  it('fetches multiple tickers successfully', async () => {
    const mockTickers: BinanceTicker[] = [
      {
        symbol: 'BTCUSDT',
        lastPrice: '50000',
        priceChange: '100.00',
        priceChangePercent: '1.5',
        weightedAvgPrice: '50000',
        prevClosePrice: '49900',
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
      },
    ];

    vi.mocked(mockTransport.request).mockResolvedValue({ data: mockTickers, status: 200 });

    const tickers = await client.getTickers();

    expect(tickers.length).toBe(1);
    expect(tickers[0].symbol).toBe('BTCUSDT');
  });

  it('fetches order book successfully', async () => {
    const mockOrderBook: BinanceOrderBook = {
      bids: [
        ['49999.99', '1.0'],
        ['49999.00', '2.0'],
      ],
      asks: [
        ['50000.01', '1.0'],
        ['50001.00', '2.0'],
      ],
      lastUpdateId: 123456,
    };

    vi.mocked(mockTransport.request).mockResolvedValue({ data: mockOrderBook, status: 200 });

    const orderBook = await client.getOrderBook('BTCUSDT', 20);

    expect(orderBook.bids.length).toBe(2);
    expect(orderBook.asks.length).toBe(2);
  });

  it('fetches trading fees successfully', async () => {
    const mockFees: BinanceAccountTradeList = {
      tradeFees: [
        {
          symbol: 'BTCUSDT',
          makerCommission: '0.001',
          takerCommission: '0.001',
        },
      ],
      makerCommission: 10,
      takerCommission: 10,
      buyerCommission: 0,
      sellerCommission: 0,
    };

    vi.mocked(mockTransport.request).mockResolvedValue({ data: mockFees, status: 200 });

    const fees = await client.getTradingFees();

    expect(fees.tradeFees.length).toBe(1);
    expect(fees.tradeFees[0].symbol).toBe('BTCUSDT');
  });

  it('handles API errors gracefully', async () => {
    const error = new Error('API Error: 400 Bad Request');
    vi.mocked(mockTransport.request).mockRejectedValue(error);

    await expect(client.getTicker('INVALID')).rejects.toThrow('API Error');
  });

  it('pings the API successfully', async () => {
    vi.mocked(mockTransport.request).mockResolvedValue({ data: {}, status: 200 });

    await expect(client.ping()).resolves.toBeUndefined();
  });
});
