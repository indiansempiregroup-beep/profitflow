import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@/database/client.js';
import { verifyAccessToken } from '@/core/auth.js';
import { loadUserExchangeCredentials } from '@/api/routes/exchange-connections.js';
import {
  fetchExchangeBalances,
  type ExchangeBalanceSnapshot,
} from '@/services/exchange-credentials.js';

const getAuthenticatedUserId = (authorization: string | undefined): string | null => {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
    return null;
  }

  return String((payload as { sub: string }).sub);
};

export const portfolioRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/portfolio', async (request, reply) => {
    const userId = getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const credentials = await loadUserExchangeCredentials(userId);
    const snapshots: ExchangeBalanceSnapshot[] = [];

    for (const entry of credentials) {
      try {
        const balances = await fetchExchangeBalances(entry.exchangeName, entry.credentials);
        snapshots.push({
          exchangeName: entry.exchangeName,
          balances,
          fetchedAt: new Date().toISOString(),
        });
      } catch (error) {
        snapshots.push({
          exchangeName: entry.exchangeName,
          balances: [],
          fetchedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unable to fetch balances.',
        });
      }
    }

    const openPaperTrades = await prisma.paperTrade.findMany({
      where: { userId, status: 'open' },
      orderBy: { openedAt: 'desc' },
    });

    const closedPaperTrades = await prisma.paperTrade.findMany({
      where: { userId, status: 'closed' },
      orderBy: { closedAt: 'desc' },
      take: 10,
    });

    const totalEstimatedProfit = openPaperTrades.reduce(
      (sum, trade) => sum + Number(trade.estimatedProfit),
      0,
    );
    const totalRealizedProfit = closedPaperTrades.reduce(
      (sum, trade) => sum + Number(trade.realizedProfit ?? 0),
      0,
    );

    return {
      success: true,
      connectedExchanges: credentials.map((entry) => entry.exchangeName),
      exchangeBalances: snapshots,
      paperTrades: {
        open: openPaperTrades.map((trade) => ({
          id: trade.id,
          symbol: trade.symbol,
          buyExchange: trade.buyExchange,
          sellExchange: trade.sellExchange,
          buyPrice: Number(trade.buyPrice),
          sellPrice: Number(trade.sellPrice),
          quantity: Number(trade.quantity),
          estimatedProfit: Number(trade.estimatedProfit),
          status: trade.status,
          openedAt: trade.openedAt.toISOString(),
        })),
        closed: closedPaperTrades.map((trade) => ({
          id: trade.id,
          symbol: trade.symbol,
          buyExchange: trade.buyExchange,
          sellExchange: trade.sellExchange,
          buyPrice: Number(trade.buyPrice),
          sellPrice: Number(trade.sellPrice),
          quantity: Number(trade.quantity),
          estimatedProfit: Number(trade.estimatedProfit),
          realizedProfit: Number(trade.realizedProfit ?? 0),
          status: trade.status,
          openedAt: trade.openedAt.toISOString(),
          closedAt: trade.closedAt?.toISOString(),
        })),
      },
      summary: {
        connectedExchangeCount: credentials.length,
        openPaperTradeCount: openPaperTrades.length,
        totalEstimatedProfit,
        totalRealizedProfit,
      },
    };
  });
};
