import { prisma } from '@/database/client.js';
import type { ValidatedOpportunity } from '@profitflow/shared';
import type { Prisma } from '@prisma/client';

export async function persistValidatedOpportunity(
  opportunity: ValidatedOpportunity,
): Promise<void> {
  await prisma.arbitrageOpportunity.upsert({
    where: { id: opportunity.id },
    create: {
      id: opportunity.id,
      symbol: opportunity.symbol,
      marketType: opportunity.marketType,
      buyExchange: opportunity.buyExchange,
      sellExchange: opportunity.sellExchange,
      buyPrice: opportunity.buyPrice,
      sellPrice: opportunity.sellPrice,
      spread: opportunity.spread,
      spreadPercentage: opportunity.spreadPercentage,
      estimatedProfit: opportunity.estimatedProfit,
      detectedAt: new Date(opportunity.detectedAt),
      sourceDataTimestamp: new Date(opportunity.sourceDataTimestamp),
      feeAnalysis: opportunity.feeAnalysis as unknown as Prisma.InputJsonValue,
      liquidityScore: opportunity.liquidityScore as unknown as Prisma.InputJsonValue,
      slippageEstimate: opportunity.slippageEstimate as unknown as Prisma.InputJsonValue,
      confidence: opportunity.confidence,
      validatedAt: new Date(opportunity.validatedAt),
    },
    update: {
      symbol: opportunity.symbol,
      marketType: opportunity.marketType,
      buyExchange: opportunity.buyExchange,
      sellExchange: opportunity.sellExchange,
      buyPrice: opportunity.buyPrice,
      sellPrice: opportunity.sellPrice,
      spread: opportunity.spread,
      spreadPercentage: opportunity.spreadPercentage,
      estimatedProfit: opportunity.estimatedProfit,
      detectedAt: new Date(opportunity.detectedAt),
      sourceDataTimestamp: new Date(opportunity.sourceDataTimestamp),
      feeAnalysis: opportunity.feeAnalysis as unknown as Prisma.InputJsonValue,
      liquidityScore: opportunity.liquidityScore as unknown as Prisma.InputJsonValue,
      slippageEstimate: opportunity.slippageEstimate as unknown as Prisma.InputJsonValue,
      confidence: opportunity.confidence,
      validatedAt: new Date(opportunity.validatedAt),
    },
  });
}
