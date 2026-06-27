import type { OrderBook, Ticker } from '@profitflow/shared';
import type { BaseExchangeProvider } from '../base-exchange-provider.js';
import { InternalEventBus, type AggregatorEvent } from './event-bus.js';
import { NormalizedMarketStore, type ProviderMarketState } from './store.js';
import { ProviderHealthMonitor } from './health-monitor.js';
import { StaleDataDetector } from './stale-detector.js';

interface AggregatorProviderLike extends BaseExchangeProvider {
  getTicker?(symbol: string): Promise<Ticker | undefined>;
  getOrderBook?(symbol: string): Promise<OrderBook | undefined>;
}

export interface MarketDataAggregatorOptions {
  eventBus: InternalEventBus;
  store: NormalizedMarketStore;
  healthMonitor: ProviderHealthMonitor;
  staleDetector: StaleDataDetector;
  now?: () => Date;
}

export class MarketDataAggregator {
  private readonly providers = new Map<string, BaseExchangeProvider>();
  private readonly registeredSymbols = new Map<string, string[]>();
  private readonly now: () => Date;

  constructor(private readonly options: MarketDataAggregatorOptions) {
    this.now = options.now ?? (() => new Date());
  }

  registerProvider(provider: BaseExchangeProvider, symbols: string[] = []): void {
    this.providers.set(provider.name.toLowerCase(), provider);
    this.registeredSymbols.set(provider.name.toLowerCase(), symbols);
  }

  async startProvider(providerName: string): Promise<void> {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      throw new Error(`Provider ${providerName} is not registered`);
    }

    if (!provider.getConnectionState().connected) {
      await provider.connect();
    }

    const timestamp = this.now().toISOString();
    this.options.healthMonitor.recordConnected(provider.name, timestamp);
    this.publish('provider.connected', provider.name, '', '', timestamp, { connected: true });

    const symbols = this.registeredSymbols.get(provider.name.toLowerCase()) ?? [];
    for (const symbol of symbols) {
      const canonicalSymbol = this.normalizeCanonicalSymbol(symbol);
      const ticker = await this.fetchTicker(provider as AggregatorProviderLike, symbol);
      if (ticker) {
        this.ingestTicker(provider.name, symbol, canonicalSymbol, ticker, timestamp);
      }

      const orderBook = await this.fetchOrderBook(provider as AggregatorProviderLike, symbol);
      if (orderBook) {
        this.ingestOrderBook(provider.name, symbol, canonicalSymbol, orderBook, timestamp);
      }
    }
  }

  async stopProvider(providerName: string): Promise<void> {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      return;
    }

    await provider.disconnect();
    const timestamp = this.now().toISOString();
    this.options.healthMonitor.recordDisconnected(provider.name, timestamp);
    this.publish('provider.disconnected', provider.name, '', '', timestamp, { connected: false });
  }

  async handleTickerUpdate(providerName: string, symbol: string, ticker: Ticker): Promise<void> {
    const canonicalSymbol = this.normalizeCanonicalSymbol(symbol);
    const timestamp = this.now().toISOString();
    this.ingestTicker(providerName, symbol, canonicalSymbol, ticker, timestamp);
  }

  async handleOrderBookUpdate(providerName: string, symbol: string, orderBook: OrderBook): Promise<void> {
    const canonicalSymbol = this.normalizeCanonicalSymbol(symbol);
    const timestamp = this.now().toISOString();
    this.ingestOrderBook(providerName, symbol, canonicalSymbol, orderBook, timestamp);
  }

  detectStale(now: Date = this.now()): void {
    for (const [providerName, symbols] of this.registeredSymbols.entries()) {
      const provider = this.providers.get(providerName);
      if (!provider) {
        continue;
      }

      for (const symbol of symbols) {
        const canonicalSymbol = this.normalizeCanonicalSymbol(symbol);
        const state = this.options.store.getByCanonicalSymbol(canonicalSymbol);
        if (!state) {
          continue;
        }

        if (this.options.staleDetector.isStale(state.lastUpdateAt, now)) {
          state.healthStatus = 'stale';
          this.options.healthMonitor.recordFailure(provider.name, now.toISOString());
          this.publish('provider.stale', provider.name, symbol, canonicalSymbol, now.toISOString(), { stale: true });
        }
      }
    }
  }

  private ingestTicker(providerName: string, symbol: string, canonicalSymbol: string, ticker: Ticker, timestamp: string): void {
    const state = this.ensureState(providerName, symbol, canonicalSymbol);
    state.ticker = ticker;
    state.providerTimestamp = timestamp;
    state.lastUpdateAt = timestamp;
    state.healthStatus = 'healthy';
    this.options.store.upsert(state);
    this.options.healthMonitor.recordMarketUpdate(providerName, timestamp, 10);
    this.publish('ticker.updated', providerName, symbol, canonicalSymbol, timestamp, ticker);
  }

  private ingestOrderBook(providerName: string, symbol: string, canonicalSymbol: string, orderBook: OrderBook, timestamp: string): void {
    const state = this.ensureState(providerName, symbol, canonicalSymbol);
    state.orderBook = orderBook;
    state.providerTimestamp = timestamp;
    state.lastUpdateAt = timestamp;
    state.healthStatus = 'healthy';
    this.options.store.upsert(state);
    this.options.healthMonitor.recordMarketUpdate(providerName, timestamp, 12);
    this.publish('orderbook.updated', providerName, symbol, canonicalSymbol, timestamp, orderBook);
  }

  private async fetchTicker(provider: AggregatorProviderLike, symbol: string): Promise<Ticker | undefined> {
    if (provider.getTicker) {
      return provider.getTicker(symbol);
    }

    const marketSnapshot = await provider.getMarketData(symbol);
    return {
      id: `${provider.name}:${symbol}`,
      exchange: provider.name as never,
      symbol: marketSnapshot.symbol,
      price: marketSnapshot.price,
      volume24h: 0,
      change24h: 0,
      generatedAt: marketSnapshot.receivedAt,
    };
  }

  private async fetchOrderBook(provider: AggregatorProviderLike, symbol: string): Promise<OrderBook | undefined> {
    if (provider.getOrderBook) {
      return provider.getOrderBook(symbol);
    }

    return undefined;
  }

  private ensureState(providerName: string, symbol: string, canonicalSymbol: string): ProviderMarketState {
    const existing = this.options.store.getByCanonicalSymbol(canonicalSymbol);
    if (existing) {
      return existing;
    }

    return this.options.store.upsert({
      exchange: providerName,
      symbol,
      canonicalSymbol,
      healthStatus: 'healthy',
    });
  }

  private normalizeCanonicalSymbol(symbol: string): string {
    return symbol.toUpperCase();
  }

  private publish<TPayload>(type: AggregatorEvent['type'], provider: string, symbol: string, canonicalSymbol: string, timestamp: string, payload: TPayload): void {
    this.options.eventBus.publish({
      type,
      provider,
      symbol,
      canonicalSymbol,
      timestamp,
      payload,
    });
  }
}
