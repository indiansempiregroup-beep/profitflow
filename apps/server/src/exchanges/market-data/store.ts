import type { ExchangeName, OrderBook, Ticker } from '@profitflow/shared';

export interface ProviderMarketState {
  exchange: string;
  symbol: string;
  canonicalSymbol: string;
  ticker?: Ticker;
  orderBook?: OrderBook;
  metadata?: Record<string, unknown>;
  providerTimestamp?: string;
  lastUpdateAt?: string;
  healthStatus: 'healthy' | 'degraded' | 'stale' | 'down';
}

export class NormalizedMarketStore {
  private readonly byExchange = new Map<string, Map<string, ProviderMarketState>>();
  private readonly bySymbol = new Map<string, ProviderMarketState>();
  private readonly byCanonicalSymbol = new Map<string, Map<string, ProviderMarketState>>();

  upsert(state: ProviderMarketState): ProviderMarketState {
    const exchangeBucket = this.byExchange.get(state.exchange) ?? new Map<string, ProviderMarketState>();
    this.byExchange.set(state.exchange, exchangeBucket);

    exchangeBucket.set(state.symbol, state);
    this.bySymbol.set(state.symbol, state);

    const canonicalBucket = this.byCanonicalSymbol.get(state.canonicalSymbol) ?? new Map<string, ProviderMarketState>();
    this.byCanonicalSymbol.set(state.canonicalSymbol, canonicalBucket);
    canonicalBucket.set(state.exchange, state);

    return state;
  }

  getByExchange(exchange: string, symbol: string): ProviderMarketState | undefined {
    return this.byExchange.get(exchange)?.get(symbol);
  }

  getBySymbol(symbol: string): ProviderMarketState | undefined {
    return this.bySymbol.get(symbol);
  }

  getByCanonicalSymbol(canonicalSymbol: string): ProviderMarketState | undefined {
    return this.byCanonicalSymbol.get(canonicalSymbol)?.values().next().value;
  }

  listByCanonicalSymbol(canonicalSymbol: string): ProviderMarketState[] {
    return Array.from(this.byCanonicalSymbol.get(canonicalSymbol)?.values() ?? []);
  }

  delete(exchange: string, symbol: string): void {
    const exchangeBucket = this.byExchange.get(exchange);
    const state = exchangeBucket?.get(symbol);
    if (!state) {
      return;
    }

    exchangeBucket?.delete(symbol);
    this.bySymbol.delete(symbol);

    const canonicalBucket = this.byCanonicalSymbol.get(state.canonicalSymbol);
    canonicalBucket?.delete(exchange);
    if (canonicalBucket?.size === 0) {
      this.byCanonicalSymbol.delete(state.canonicalSymbol);
    }
  }

  list(): ProviderMarketState[] {
    return Array.from(this.byCanonicalSymbol.values()).flatMap((bucket) => Array.from(bucket.values()));
  }

  markHealth(exchange: string, symbol: string, healthStatus: ProviderMarketState['healthStatus']): void {
    const state = this.getByExchange(exchange, symbol);
    if (!state) {
      return;
    }

    state.healthStatus = healthStatus;
  }
}
