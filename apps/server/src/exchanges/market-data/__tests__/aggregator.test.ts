import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseExchangeProvider } from '../../base-exchange-provider.js';
import type { ExchangeConfig } from '../../types.js';
import { ExchangeName, type OrderBook, type Ticker } from '@profitflow/shared';
import { InternalEventBus } from '../event-bus.js';
import { MarketDataAggregator } from '../aggregator.js';
import { NormalizedMarketStore } from '../store.js';
import { ProviderHealthMonitor } from '../health-monitor.js';
import { StaleDataDetector } from '../stale-detector.js';

class MockProvider extends BaseExchangeProvider {
  public connectCalls = 0;
  public disconnectCalls = 0;

  constructor(name: string, config: ExchangeConfig = {}) {
    super(name, config, undefined, undefined);
  }

  override async connect(): Promise<void> {
    this.connectCalls += 1;
    this.connectionState.connected = true;
    this.connectionState.reconnectAttempts = 0;
  }

  override async disconnect(): Promise<void> {
    this.disconnectCalls += 1;
    this.connectionState.connected = false;
  }

  async getTicker(symbol: string): Promise<Ticker> {
    return {
      id: `${this.name}:${symbol}`,
      exchange: this.name as ExchangeName,
      symbol,
      price: 100,
      volume24h: 1000,
      change24h: 1.5,
      generatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    };
  }

  async getOrderBook(symbol: string): Promise<OrderBook> {
    return {
      id: `${this.name}:${symbol}:orderbook`,
      exchange: this.name as ExchangeName,
      symbol,
      bids: [{ price: 99, quantity: 1 }],
      asks: [{ price: 101, quantity: 1 }],
      generatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    };
  }
}

describe('MarketDataAggregator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers providers, updates the store and publishes events', async () => {
    const eventBus = new InternalEventBus();
    const store = new NormalizedMarketStore();
    const healthMonitor = new ProviderHealthMonitor();
    const staleDetector = new StaleDataDetector(1000);
    const aggregator = new MarketDataAggregator({
      eventBus,
      store,
      healthMonitor,
      staleDetector,
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    const provider = new MockProvider('BINANCE');
    const events: Array<{ type: string; provider: string }> = [];
    eventBus.subscribe('ticker.updated', (event) => {
      events.push({ type: event.type, provider: event.provider });
    });
    eventBus.subscribe('orderbook.updated', (event) => {
      events.push({ type: event.type, provider: event.provider });
    });

    aggregator.registerProvider(provider, ['BTC/USDT']);
    await aggregator.startProvider(provider.name);

    const ticker = store.getByCanonicalSymbol('BTC/USDT')?.ticker;
    expect(provider.connectCalls).toBe(1);
    expect(ticker?.symbol).toBe('BTC/USDT');
    expect(ticker?.price).toBe(100);
    expect(events.some((event) => event.type === 'ticker.updated' && event.provider === 'BINANCE')).toBe(true);
    expect(healthMonitor.get('BINANCE').status).toBe('healthy');
  });

  it('emits disconnect and stale events when a provider stops updating', async () => {
    const eventBus = new InternalEventBus();
    const store = new NormalizedMarketStore();
    const healthMonitor = new ProviderHealthMonitor();
    const staleDetector = new StaleDataDetector(1000);
    const aggregator = new MarketDataAggregator({
      eventBus,
      store,
      healthMonitor,
      staleDetector,
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    const provider = new MockProvider('COINDCX');
    const emitted: string[] = [];
    eventBus.subscribe('provider.disconnected', (event) => emitted.push(event.type));
    eventBus.subscribe('provider.stale', (event) => emitted.push(event.type));

    aggregator.registerProvider(provider, ['BTC/USDT']);
    await aggregator.startProvider(provider.name);
    await aggregator.stopProvider(provider.name);
    aggregator.detectStale(new Date('2026-01-01T00:00:02.500Z'));

    expect(emitted).toContain('provider.disconnected');
    expect(emitted).toContain('provider.stale');
  });
});
