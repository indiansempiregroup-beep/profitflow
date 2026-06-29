import { describe, expect, it } from 'vitest';
import type { Opportunity, ValidatedOpportunity } from '@profitflow/shared';
import { MarketType, ExchangeName } from '@profitflow/shared';
import { InternalEventBus } from '@/exchanges/market-data/event-bus.js';
import { NormalizedMarketStore } from '@/exchanges/market-data/store.js';
import { StaleDataDetector } from '@/exchanges/market-data/stale-detector.js';
import { OpportunityEvaluationService } from '../opportunity-evaluation-service.js';
import {
  SimpleFeeAnalyzer,
  SimpleLiquidityAnalyzer,
  SimpleSlippageEstimator,
  SimpleConfidenceScorer,
} from '../evaluation-services.js';

describe('OpportunityEvaluationService', () => {
  it('publishes validated opportunities with fee, liquidity, slippage, and confidence metadata', async () => {
    const eventBus = new InternalEventBus();
    const store = new NormalizedMarketStore();
    const evaluationService = new OpportunityEvaluationService({
      eventBus,
      store,
      staleDetector: new StaleDataDetector(5000),
      feeAnalyzer: new SimpleFeeAnalyzer(),
      liquidityAnalyzer: new SimpleLiquidityAnalyzer(),
      slippageEstimator: new SimpleSlippageEstimator(),
      confidenceScorer: new SimpleConfidenceScorer(),
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    const events: ValidatedOpportunity[] = [];
    eventBus.subscribe('scanner.opportunity.validated', (event) => {
      events.push(event.payload as ValidatedOpportunity);
    });

    evaluationService.start();

    const opportunity: Opportunity = {
      id: 'BTC/USDT:BINANCE:COINDCX:2026-01-01T00:00:00.000Z',
      symbol: 'BTC/USDT',
      marketType: MarketType.SPOT,
      buyExchange: ExchangeName.BINANCE,
      sellExchange: ExchangeName.COINDCX,
      buyPrice: 100,
      sellPrice: 101.5,
      spread: 1.5,
      spreadPercentage: 1.5,
      estimatedProfit: 1.5,
      detectedAt: '2026-01-01T00:00:00.000Z',
      sourceDataTimestamp: '2026-01-01T00:00:00.000Z',
    };

    eventBus.publish({
      type: 'scanner.opportunity.created',
      provider: 'BINANCE',
      symbol: opportunity.symbol,
      canonicalSymbol: opportunity.symbol,
      timestamp: opportunity.detectedAt,
      payload: opportunity,
    });

    expect(events).toHaveLength(1);
    expect(events[0].feeAnalysis.totalFees).toBeGreaterThan(0);
    expect(events[0].liquidityScore.score).toBeGreaterThanOrEqual(0);
    expect(events[0].slippageEstimate.amount).toBeGreaterThanOrEqual(0);
    expect(events[0].confidence).toBeGreaterThanOrEqual(0);
    expect(events[0].validatedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
