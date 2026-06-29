import { describe, expect, it } from 'vitest';
import type { Opportunity } from '@profitflow/shared';
import { ExchangeName } from '@profitflow/shared';
import { InternalEventBus } from '../../exchanges/market-data/event-bus.js';
import { NormalizedMarketStore } from '../../exchanges/market-data/store.js';
import { StaleDataDetector } from '../../exchanges/market-data/stale-detector.js';
import { ScannerEngine } from '../scanner-engine.js';

describe('ScannerEngine', () => {
  it('detects an opportunity from healthy market data and publishes a created event', () => {
    const eventBus = new InternalEventBus();
    const store = new NormalizedMarketStore();
    const scanner = new ScannerEngine({
      eventBus,
      store,
      staleDetector: new StaleDataDetector(5000),
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    const events: Opportunity[] = [];
    eventBus.subscribe('scanner.opportunity.created', (event) => {
      events.push(event.payload as Opportunity);
    });

    store.upsert({
      exchange: ExchangeName.BINANCE,
      symbol: 'BTC/USDT',
      canonicalSymbol: 'BTC/USDT',
      healthStatus: 'healthy',
      lastUpdateAt: '2026-01-01T00:00:00.000Z',
      orderBook: {
        id: 'binance-book',
        exchange: ExchangeName.BINANCE,
        symbol: 'BTC/USDT',
        bids: [{ price: 99.5, quantity: 1 }],
        asks: [{ price: 100, quantity: 1 }],
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    store.upsert({
      exchange: ExchangeName.COINDCX,
      symbol: 'BTC/USDT',
      canonicalSymbol: 'BTC/USDT',
      healthStatus: 'healthy',
      lastUpdateAt: '2026-01-01T00:00:00.000Z',
      orderBook: {
        id: 'coindcx-book',
        exchange: ExchangeName.COINDCX,
        symbol: 'BTC/USDT',
        bids: [{ price: 101.5, quantity: 1 }],
        asks: [{ price: 101, quantity: 1 }],
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    scanner.start();
    scanner.scan('BTC/USDT');

    expect(events).toHaveLength(1);
    expect(events[0].symbol).toBe('BTC/USDT');
    expect(events[0].buyExchange).toBe(ExchangeName.BINANCE);
    expect(events[0].sellExchange).toBe(ExchangeName.COINDCX);
    expect(events[0].spread).toBe(1.5);
    expect(events[0].spreadPercentage).toBe(1.5);
  });

  it('ignores stale and unhealthy market data', () => {
    const eventBus = new InternalEventBus();
    const store = new NormalizedMarketStore();
    const scanner = new ScannerEngine({
      eventBus,
      store,
      staleDetector: new StaleDataDetector(5000),
      now: () => new Date('2026-01-01T00:00:10.000Z'),
    });

    const created: Opportunity[] = [];
    eventBus.subscribe('scanner.opportunity.created', (event) => {
      created.push(event.payload as Opportunity);
    });

    store.upsert({
      exchange: ExchangeName.BINANCE,
      symbol: 'BTC/USDT',
      canonicalSymbol: 'BTC/USDT',
      healthStatus: 'stale',
      lastUpdateAt: '2026-01-01T00:00:00.000Z',
      orderBook: {
        id: 'binance-book',
        exchange: ExchangeName.BINANCE,
        symbol: 'BTC/USDT',
        bids: [{ price: 103, quantity: 1 }],
        asks: [{ price: 104, quantity: 1 }],
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    store.upsert({
      exchange: ExchangeName.COINDCX,
      symbol: 'BTC/USDT',
      canonicalSymbol: 'BTC/USDT',
      healthStatus: 'healthy',
      lastUpdateAt: '2026-01-01T00:00:00.000Z',
      orderBook: {
        id: 'coindcx-book',
        exchange: ExchangeName.COINDCX,
        symbol: 'BTC/USDT',
        bids: [{ price: 105, quantity: 1 }],
        asks: [{ price: 106, quantity: 1 }],
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    scanner.start();
    scanner.scan('BTC/USDT');

    expect(created).toHaveLength(0);
  });

  it('publishes an expired event when an opportunity disappears', () => {
    const eventBus = new InternalEventBus();
    const store = new NormalizedMarketStore();
    const scanner = new ScannerEngine({
      eventBus,
      store,
      staleDetector: new StaleDataDetector(5000),
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    const expiredEvents: Opportunity[] = [];
    eventBus.subscribe('scanner.opportunity.expired', (event) => {
      expiredEvents.push(event.payload as Opportunity);
    });

    store.upsert({
      exchange: ExchangeName.BINANCE,
      symbol: 'BTC/USDT',
      canonicalSymbol: 'BTC/USDT',
      healthStatus: 'healthy',
      lastUpdateAt: '2026-01-01T00:00:00.000Z',
      orderBook: {
        id: 'binance-book',
        exchange: ExchangeName.BINANCE,
        symbol: 'BTC/USDT',
        bids: [{ price: 101, quantity: 1 }],
        asks: [{ price: 100, quantity: 1 }],
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    store.upsert({
      exchange: ExchangeName.COINDCX,
      symbol: 'BTC/USDT',
      canonicalSymbol: 'BTC/USDT',
      healthStatus: 'healthy',
      lastUpdateAt: '2026-01-01T00:00:00.000Z',
      orderBook: {
        id: 'coindcx-book',
        exchange: ExchangeName.COINDCX,
        symbol: 'BTC/USDT',
        bids: [{ price: 102, quantity: 1 }],
        asks: [{ price: 101, quantity: 1 }],
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    scanner.start();
    scanner.scan('BTC/USDT');

    store.delete('BINANCE', 'BTC/USDT');
    store.delete('COINDCX', 'BTC/USDT');
    scanner.scan('BTC/USDT');

    expect(expiredEvents).toHaveLength(1);
  });
});
