import type { ExchangeName, Opportunity } from '@profitflow/shared';
import { MarketType } from '@profitflow/shared';
import type { AggregatorEvent } from '../exchanges/market-data/event-bus.js';
import { InternalEventBus } from '../exchanges/market-data/event-bus.js';
import type { NormalizedMarketStore, ProviderMarketState } from '../exchanges/market-data/store.js';
import type { StaleDataDetector } from '../exchanges/market-data/stale-detector.js';

export interface ScannerEngineOptions {
  eventBus: InternalEventBus;
  store: NormalizedMarketStore;
  staleDetector: StaleDataDetector;
  now?: () => Date;
}

export class ScannerEngine {
  private readonly now: () => Date;
  private readonly subscriptions: Array<() => void> = [];
  private readonly latestOpportunities = new Map<string, Opportunity>();
  private readonly activeSymbols = new Set<string>();
  private running = false;

  constructor(private readonly options: ScannerEngineOptions) {
    this.now = options.now ?? (() => new Date());
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.subscriptions.push(
      this.options.eventBus.subscribe('ticker.updated', (event) => this.handleMarketEvent(event)),
      this.options.eventBus.subscribe('orderbook.updated', (event) => this.handleMarketEvent(event)),
      this.options.eventBus.subscribe('provider.stale', () => this.handleHealthChange()),
      this.options.eventBus.subscribe('provider.disconnected', () => this.handleHealthChange()),
    );
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    for (const unsubscribe of this.subscriptions.splice(0)) {
      unsubscribe();
    }
  }

  scan(symbol: string): void {
    const normalizedSymbol = symbol.toUpperCase();
    this.activeSymbols.add(normalizedSymbol);
    this.compareMarkets(normalizedSymbol);
  }

  compareMarkets(symbol: string): void {
    const normalizedSymbol = symbol.toUpperCase();
    const states = this.options.store.listByCanonicalSymbol(normalizedSymbol);
    if (states.length < 2) {
      this.expireOpportunity(normalizedSymbol);
      return;
    }

    const healthy = states.filter((state) => this.isEligible(state));
    if (healthy.length < 2) {
      this.expireOpportunity(normalizedSymbol);
      return;
    }

    const bestBuy = healthy.reduce((best, current) => {
      const currentAsk = current.orderBook?.asks[0]?.price;
      const bestAsk = best.orderBook?.asks[0]?.price;
      if (currentAsk === undefined) {
        return best;
      }
      if (bestAsk === undefined || currentAsk < bestAsk) {
        return current;
      }
      return best;
    }, healthy[0]);

    const bestSell = healthy.reduce((best, current) => {
      const currentBid = current.orderBook?.bids[0]?.price;
      const bestBid = best.orderBook?.bids[0]?.price;
      if (currentBid === undefined) {
        return best;
      }
      if (bestBid === undefined || currentBid > bestBid) {
        return current;
      }
      return best;
    }, healthy[0]);

    const buyPrice = bestBuy.orderBook?.asks[0]?.price;
    const sellPrice = bestSell.orderBook?.bids[0]?.price;
    if (buyPrice === undefined || sellPrice === undefined || bestBuy.exchange === bestSell.exchange) {
      this.expireOpportunity(normalizedSymbol);
      return;
    }

    const spread = sellPrice - buyPrice;
    if (spread <= 0) {
      this.expireOpportunity(normalizedSymbol);
      return;
    }

    const spreadPercentage = Number(((spread / buyPrice) * 100).toFixed(2));
    const opportunity: Opportunity = {
      id: `${normalizedSymbol}:${bestBuy.exchange}:${bestSell.exchange}:${this.now().toISOString()}`,
      symbol: normalizedSymbol,
      marketType: MarketType.SPOT,
      buyExchange: bestBuy.exchange as ExchangeName,
      sellExchange: bestSell.exchange as ExchangeName,
      buyPrice,
      sellPrice,
      spread,
      spreadPercentage,
      estimatedProfit: spread,
      detectedAt: this.now().toISOString(),
      sourceDataTimestamp: this.now().toISOString(),
    };

    this.publishOpportunity(opportunity);
  }

  publishOpportunity(opportunity: Opportunity): void {
    const previous = this.latestOpportunities.get(opportunity.symbol);
    if (previous && previous.buyExchange === opportunity.buyExchange && previous.sellExchange === opportunity.sellExchange) {
      this.options.eventBus.publish({
        type: 'scanner.opportunity.updated',
        provider: opportunity.buyExchange,
        symbol: opportunity.symbol,
        canonicalSymbol: opportunity.symbol,
        timestamp: opportunity.detectedAt,
        payload: opportunity,
      });
    } else {
      if (previous) {
        this.publishExpired(previous);
      }

      this.options.eventBus.publish({
        type: 'scanner.opportunity.created',
        provider: opportunity.buyExchange,
        symbol: opportunity.symbol,
        canonicalSymbol: opportunity.symbol,
        timestamp: opportunity.detectedAt,
        payload: opportunity,
      });
    }

    this.latestOpportunities.set(opportunity.symbol, opportunity);
  }

  private expireOpportunity(symbol: string): void {
    const previous = this.latestOpportunities.get(symbol);
    if (!previous) {
      return;
    }

    this.publishExpired(previous);
    this.latestOpportunities.delete(symbol);
  }

  private publishExpired(opportunity: Opportunity): void {
    this.options.eventBus.publish({
      type: 'scanner.opportunity.expired',
      provider: opportunity.buyExchange,
      symbol: opportunity.symbol,
      canonicalSymbol: opportunity.symbol,
      timestamp: this.now().toISOString(),
      payload: opportunity,
    });
  }

  private handleMarketEvent(event: AggregatorEvent): void {
    if (!this.running) {
      return;
    }

    if (event.canonicalSymbol) {
      this.scan(event.canonicalSymbol);
    }
  }

  private handleHealthChange(): void {
    for (const symbol of this.activeSymbols) {
      this.compareMarkets(symbol);
    }
  }

  private isEligible(state: ProviderMarketState): boolean {
    if (state.healthStatus === 'stale' || state.healthStatus === 'down' || state.healthStatus === 'degraded') {
      return false;
    }

    const lastUpdateAt = state.lastUpdateAt;
    if (!lastUpdateAt) {
      return false;
    }

    return !this.options.staleDetector.isStale(lastUpdateAt, this.now());
  }
}
