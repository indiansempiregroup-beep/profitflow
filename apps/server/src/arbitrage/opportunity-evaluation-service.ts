import type {
  Opportunity,
  ValidatedOpportunity,
  FeeAnalysis,
  LiquidityScore,
  SlippageEstimate,
  NetworkFeeEstimate,
} from '@profitflow/shared';
import type { InternalEventBus } from '@/exchanges/market-data/event-bus.js';
import type { StaleDataDetector } from '@/exchanges/market-data/stale-detector.js';
import type { NormalizedMarketStore } from '@/exchanges/market-data/store.js';

export interface OpportunityEvaluationOptions {
  eventBus: InternalEventBus;
  store: NormalizedMarketStore;
  staleDetector: StaleDataDetector;
  feeAnalyzer: FeeAnalyzer;
  liquidityAnalyzer: LiquidityAnalyzer;
  slippageEstimator: SlippageEstimator;
  confidenceScorer: ConfidenceScorer;
  now?: () => Date;
}

export class OpportunityEvaluationService {
  private readonly now: () => Date;
  private readonly validatedOpportunities = new Map<string, ValidatedOpportunity>();

  constructor(private readonly options: OpportunityEvaluationOptions) {
    this.now = options.now ?? (() => new Date());
  }

  start(): void {
    this.options.eventBus.subscribe('scanner.opportunity.created', (event) => {
      void this.evaluateOpportunity(event.payload as Opportunity);
    });

    this.options.eventBus.subscribe('scanner.opportunity.expired', (event) => {
      const opportunity = event.payload as Opportunity;
      const existing = this.validatedOpportunities.get(opportunity.id);
      if (!existing) {
        return;
      }

      this.options.eventBus.publish({
        type: 'scanner.opportunity.validation.expired',
        provider: opportunity.buyExchange,
        symbol: opportunity.symbol,
        canonicalSymbol: opportunity.symbol,
        timestamp: this.now().toISOString(),
        payload: existing,
      });

      this.validatedOpportunities.delete(opportunity.id);
    });
  }

  private async evaluateOpportunity(opportunity: Opportunity): Promise<void> {
    try {
      const feeAnalysis = this.options.feeAnalyzer.analyze(opportunity);
      const liquidityScore = this.options.liquidityAnalyzer.analyze(opportunity);
      const slippageEstimate = this.options.slippageEstimator.estimate(opportunity);
      const confidence = this.options.confidenceScorer.score(
        opportunity,
        feeAnalysis,
        liquidityScore,
        slippageEstimate,
      );

      const enrichedFeeAnalysis: FeeAnalysis = {
        ...feeAnalysis,
        totalTradingFees: feeAnalysis.buyFee + feeAnalysis.sellFee,
        networkFee: {
          asset: 'USD',
          amount: 0,
          currency: 'USD',
        } as NetworkFeeEstimate,
        totalFees: feeAnalysis.buyFee + feeAnalysis.sellFee,
      };

      if (!this.isOpportunityProfitable(opportunity, feeAnalysis, slippageEstimate)) {
        this.options.eventBus.publish({
          type: 'scanner.opportunity.ranked',
          provider: opportunity.buyExchange,
          symbol: opportunity.symbol,
          canonicalSymbol: opportunity.symbol,
          timestamp: this.now().toISOString(),
          payload: {
            ...opportunity,
            score: confidence,
            reason: 'Not profitable after fees and slippage',
          },
        });
        return;
      }

      const validatedOpportunity: ValidatedOpportunity = {
        ...opportunity,
        feeAnalysis: enrichedFeeAnalysis,
        liquidityScore,
        slippageEstimate,
        confidence,
        validatedAt: this.now().toISOString(),
      };

      this.validatedOpportunities.set(opportunity.id, validatedOpportunity);

      this.options.eventBus.publish({
        type: 'scanner.opportunity.validated',
        provider: opportunity.buyExchange,
        symbol: opportunity.symbol,
        canonicalSymbol: opportunity.symbol,
        timestamp: validatedOpportunity.validatedAt,
        payload: validatedOpportunity,
      });
    } catch {
      // Intentionally swallow evaluation errors to avoid disrupting scanner flow.
    }
  }

  getValidatedOpportunities(): ValidatedOpportunity[] {
    return Array.from(this.validatedOpportunities.values());
  }

  stop(): void {
    // Cleanup any resources if needed
    this.validatedOpportunities.clear();
  }

  private isOpportunityProfitable(
    opportunity: Opportunity,
    feeAnalysis: FeeAnalysis,
    slippageEstimate: SlippageEstimate,
  ): boolean {
    const netProfit = opportunity.spread - feeAnalysis.totalFees - slippageEstimate.amount;
    return netProfit > 0;
  }
}

export interface FeeAnalyzer {
  analyze(opportunity: Opportunity): FeeAnalysis;
}

export interface LiquidityAnalyzer {
  analyze(opportunity: Opportunity): LiquidityScore;
}

export interface SlippageEstimator {
  estimate(opportunity: Opportunity): SlippageEstimate;
}

export interface ConfidenceScorer {
  score(
    opportunity: Opportunity,
    feeAnalysis: FeeAnalysis,
    liquidityScore: LiquidityScore,
    slippageEstimate: SlippageEstimate,
  ): number;
}
