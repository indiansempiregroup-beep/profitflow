import type {
  Opportunity,
  FeeAnalysis,
  LiquidityScore,
  SlippageEstimate,
} from '@profitflow/shared';

export class SimpleFeeAnalyzer {
  analyze(opportunity: Opportunity): FeeAnalysis {
    const buyFee = opportunity.buyPrice * 0.0015;
    const sellFee = opportunity.sellPrice * 0.0015;
    const networkFee = {
      asset: 'USDT',
      amount: 0.5,
      currency: 'USDT',
    };
    const totalTradingFees = buyFee + sellFee;
    const totalFees = totalTradingFees + networkFee.amount;

    return {
      buyFee: Number(buyFee.toFixed(6)),
      sellFee: Number(sellFee.toFixed(6)),
      totalTradingFees: Number(totalTradingFees.toFixed(6)),
      networkFee,
      totalFees: Number(totalFees.toFixed(6)),
    };
  }
}

export class SimpleLiquidityAnalyzer {
  analyze(opportunity: Opportunity): LiquidityScore {
    const spreadPercentage = (opportunity.spread / opportunity.buyPrice) * 100;
    const score = Math.max(0, 100 - spreadPercentage * 10);
    return {
      score: Number(Math.max(0, Math.min(100, score)).toFixed(2)),
      details: 'Liquidity estimated from spread and top-of-book depth',
    };
  }
}

export class SimpleSlippageEstimator {
  estimate(opportunity: Opportunity): SlippageEstimate {
    const percentage = Math.min(0.5, opportunity.spreadPercentage * 0.1);
    const amount = Number((opportunity.buyPrice * (percentage / 100)).toFixed(6));

    return {
      amount,
      percentage: Number(percentage.toFixed(2)),
      details: 'Estimated slippage from opportunity spread',
    };
  }
}

export class SimpleConfidenceScorer {
  score(
    opportunity: Opportunity,
    feeAnalysis: FeeAnalysis,
    liquidityScore: LiquidityScore,
    slippageEstimate: SlippageEstimate,
  ): number {
    const base = opportunity.spreadPercentage;
    const feeImpact = Math.max(0, 10 - feeAnalysis.totalFees * 10);
    const liquidityImpact = liquidityScore.score / 10;
    const slippageImpact = Math.max(0, 10 - slippageEstimate.percentage);

    const raw = base + feeImpact + liquidityImpact + slippageImpact;
    const normalized = Math.min(100, Math.max(0, raw / 4));

    return Number(normalized.toFixed(2));
  }
}
