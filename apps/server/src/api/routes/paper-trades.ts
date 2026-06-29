import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/database/client.js';
import { verifyAccessToken } from '@/core/auth.js';
import { createNotification } from '@/services/notification-service.js';

const createPaperTradeSchema = z.object({
  opportunityId: z.string().optional(),
  symbol: z.string().min(3),
  buyExchange: z.string().min(2),
  sellExchange: z.string().min(2),
  buyPrice: z.number().positive(),
  sellPrice: z.number().positive(),
  quantity: z.number().positive().default(1),
  estimatedProfit: z.number(),
});

const closePaperTradeSchema = z.object({
  realizedProfit: z.number(),
});

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

export const paperTradeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/paper-trades', async (request, reply) => {
    const userId = getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const trades = await prisma.paperTrade.findMany({
      where: { userId },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      trades: trades.map((trade) => ({
        id: trade.id,
        opportunityId: trade.opportunityId,
        symbol: trade.symbol,
        buyExchange: trade.buyExchange,
        sellExchange: trade.sellExchange,
        buyPrice: Number(trade.buyPrice),
        sellPrice: Number(trade.sellPrice),
        quantity: Number(trade.quantity),
        estimatedProfit: Number(trade.estimatedProfit),
        realizedProfit: trade.realizedProfit ? Number(trade.realizedProfit) : null,
        status: trade.status,
        openedAt: trade.openedAt.toISOString(),
        closedAt: trade.closedAt?.toISOString(),
      })),
    };
  });

  fastify.post('/paper-trades', async (request, reply) => {
    const userId = getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const body = createPaperTradeSchema.parse(request.body);
    const trade = await prisma.paperTrade.create({
      data: {
        userId,
        opportunityId: body.opportunityId,
        symbol: body.symbol,
        buyExchange: body.buyExchange,
        sellExchange: body.sellExchange,
        buyPrice: body.buyPrice,
        sellPrice: body.sellPrice,
        quantity: body.quantity,
        estimatedProfit: body.estimatedProfit,
      },
    });

    await createNotification(prisma, {
      userId,
      title: 'Paper trade opened',
      body: `${body.symbol} paper trade opened with an estimated profit of ${body.estimatedProfit.toFixed(2)}.`,
      type: 'PaperTrade',
      data: { tradeId: trade.id, symbol: body.symbol },
    });

    return {
      success: true,
      trade: {
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
      },
    };
  });

  fastify.post('/paper-trades/:id/close', async (request, reply) => {
    const userId = getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const tradeId = String((request.params as { id: string }).id);
    const body = closePaperTradeSchema.parse(request.body);

    const existing = await prisma.paperTrade.findFirst({ where: { id: tradeId, userId } });
    if (!existing) {
      return reply
        .status(404)
        .send({ success: false, error: { code: 'NOT_FOUND', message: 'Paper trade not found.' } });
    }

    const trade = await prisma.paperTrade.update({
      where: { id: tradeId },
      data: {
        status: 'closed',
        closedAt: new Date(),
        realizedProfit: body.realizedProfit,
      },
    });

    await createNotification(prisma, {
      userId,
      title: 'Paper trade closed',
      body: `${trade.symbol} paper trade closed with realized profit of ${body.realizedProfit.toFixed(2)}.`,
      type: 'PaperTrade',
      data: { tradeId: trade.id, symbol: trade.symbol },
    });

    return {
      success: true,
      trade: {
        id: trade.id,
        status: trade.status,
        realizedProfit: Number(trade.realizedProfit ?? 0),
        closedAt: trade.closedAt?.toISOString(),
      },
    };
  });
};
