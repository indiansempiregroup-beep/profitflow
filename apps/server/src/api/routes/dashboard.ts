import type { FastifyPluginAsync, FastifyInstance } from 'fastify';
import type { RuntimeServices } from '@/runtime.js';
import { prisma } from '@/database/client.js';
import { verifyAccessToken } from '@/core/auth.js';
import { normalizeMarketQuoteSymbol } from './market-quote-utils.js';
import {
  toRuntimeExchangeName,
  type SupportedExchangeName,
} from '@/services/exchange-credentials.js';

const filterByConnectedExchanges = <
  T extends { buyExchange?: string; sellExchange?: string; exchange?: string },
>(
  items: T[],
  connectedExchanges: string[],
): T[] => {
  if (connectedExchanges.length === 0) {
    return items;
  }

  const normalized = new Set(
    connectedExchanges.map((exchange) =>
      toRuntimeExchangeName(exchange as SupportedExchangeName).toUpperCase(),
    ),
  );

  return items.filter((item) => {
    if (item.exchange) {
      return normalized.has(item.exchange.toUpperCase());
    }

    const buy = item.buyExchange?.toUpperCase();
    const sell = item.sellExchange?.toUpperCase();
    return Boolean(buy && sell && normalized.has(buy) && normalized.has(sell));
  });
};

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/dashboard', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const payload = verifyAccessToken(token);
    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const runtime = (fastify as FastifyInstance & { runtimeServices?: RuntimeServices })
      .runtimeServices;
    if (!runtime) {
      throw new Error('Runtime services are not available yet.');
    }

    const userId = String((payload as { sub: string }).sub);
    const healthMonitor = runtime.opportunityEngine.getHealthMonitor();
    const marketStates = runtime.opportunityEngine.getStore().list();
    const monitoredSymbols = new Set(marketStates.map((state) => state.canonicalSymbol));
    const providers = runtime.providers.map((provider) => healthMonitor.get(provider.name));
    const overallStatus = providers.some((provider) => provider.status !== 'healthy')
      ? 'degraded'
      : 'healthy';
    const userConnections = await prisma.exchangeConnection.findMany({ where: { userId } });
    const connectedExchanges = userConnections.map((connection) => connection.exchangeName);
    const marketSnapshots = filterByConnectedExchanges(
      marketStates
        .filter((state) => state.orderBook || state.ticker)
        .slice(0, 24)
        .map((state) => ({
          exchange: state.exchange,
          symbol: state.canonicalSymbol,
          bid: state.orderBook?.bids[0]?.price ?? state.ticker?.price ?? 0,
          ask: state.orderBook?.asks[0]?.price ?? state.ticker?.price ?? 0,
          price:
            state.ticker?.price ??
            state.orderBook?.asks[0]?.price ??
            state.orderBook?.bids[0]?.price ??
            0,
          lastUpdateAt: state.lastUpdateAt,
          healthStatus: state.healthStatus,
        })),
      connectedExchanges,
    );

    const allOpportunities = await prisma.arbitrageOpportunity.findMany({
      orderBy: { validatedAt: 'desc' },
      take: 50,
    });

    const opportunities = filterByConnectedExchanges(
      allOpportunities.map((opportunity) => ({
        id: opportunity.id,
        symbol: opportunity.symbol,
        marketType: opportunity.marketType,
        buyExchange: opportunity.buyExchange,
        sellExchange: opportunity.sellExchange,
        buyPrice: Number(opportunity.buyPrice),
        sellPrice: Number(opportunity.sellPrice),
        spread: Number(opportunity.spread),
        spreadPercentage: Number(opportunity.spreadPercentage),
        estimatedProfit: Number(opportunity.estimatedProfit),
        detectedAt: opportunity.detectedAt.toISOString(),
        sourceDataTimestamp: opportunity.sourceDataTimestamp.toISOString(),
        feeAnalysis: opportunity.feeAnalysis,
        liquidityScore: opportunity.liquidityScore,
        slippageEstimate: opportunity.slippageEstimate,
        confidence: Number(opportunity.confidence),
        validatedAt: opportunity.validatedAt.toISOString(),
      })),
      connectedExchanges,
    ).slice(0, 25);

    return {
      overallStatus,
      connectedExchanges,
      providers,
      marketDataCount: marketStates.length,
      monitoredSymbolCount: monitoredSymbols.size,
      marketSnapshots,
      opportunities,
    };
  });

  fastify.get('/market-quote', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const payload = verifyAccessToken(token);
    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const runtime = (fastify as FastifyInstance & { runtimeServices?: RuntimeServices })
      .runtimeServices;
    if (!runtime) {
      throw new Error('Runtime services are not available yet.');
    }

    const symbol = String((request.query as { symbol?: string } | undefined)?.symbol ?? '').trim();
    if (!symbol) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_SYMBOL', message: 'A symbol is required.' },
      });
    }

    const normalizedSymbol = normalizeMarketQuoteSymbol(symbol);
    const results = await Promise.allSettled(
      runtime.providers.map(async (provider) => {
        const tickerProvider = provider as typeof provider & {
          getTicker?: (symbol: string) => Promise<{ price: number; generatedAt: string }>;
        };
        if (!tickerProvider.getTicker) {
          return null;
        }

        const ticker = await tickerProvider.getTicker(normalizedSymbol);
        return {
          exchange: provider.name,
          symbol: normalizedSymbol,
          price: ticker.price,
          bid: ticker.price,
          ask: ticker.price,
          lastUpdateAt: ticker.generatedAt,
          healthStatus: 'healthy' as const,
        };
      }),
    );

    const marketQuotes = results.flatMap((result) =>
      result.status === 'fulfilled' && result.value ? [result.value] : [],
    );

    return {
      success: true,
      symbol: normalizedSymbol,
      quotes: marketQuotes,
    };
  });
};
