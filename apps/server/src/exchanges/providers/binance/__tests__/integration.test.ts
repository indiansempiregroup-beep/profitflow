import { describe, it, expect, vi, beforeEach } from 'vitest';
import pino from 'pino';
import { BinanceProvider } from '../provider.js';
import type { RestClientTransport } from '../../transport/rest-client.js';

class MockTransport implements RestClientTransport {
  request = vi.fn();
}

describe('BinanceProvider integration (mocked transports)', () => {
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

  it('full lifecycle: connect, get markets, get tickers, disconnect', async () => {
    // ping
    vi.mocked(transport.request).mockResolvedValueOnce({});

    // exchangeInfo
    vi.mocked(transport.request).mockResolvedValueOnce({
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
    });

    // tickers
    vi.mocked(transport.request).mockResolvedValueOnce([
      {
        symbol: 'BTCUSDT',
        lastPrice: '50000',
        priceChangePercent: '1.2',
        priceChange: '600',
        weightedAvgPrice: '49500',
        prevClosePrice: '49400',
        lastQty: '0.1',
        bidPrice: '49999',
        bidQty: '1',
        askPrice: '50001',
        askQty: '1',
        openPrice: '49400',
        highPrice: '50200',
        lowPrice: '49300',
        volume: '1000',
        quoteAssetVolume: '50000000',
        openTime: 0,
        closeTime: 0,
        firstId: 0,
        lastId: 0,
        count: 0,
      },
    ]);

    await provider.connect();

    const markets = await provider.getMarkets();
    expect(markets.length).toBe(1);

    const tickers = await provider.getTickers();
    expect(tickers.length).toBe(1);

    await provider.disconnect();
  });
});
