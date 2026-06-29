import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@/database/client.js';
import { verifyAccessToken } from '@/core/auth.js';

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/profile', async (request, reply) => {
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

    const userId = String((payload as { sub: string }).sub);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const connections = await prisma.exchangeConnection.findMany({ where: { userId } });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      connectedExchanges: connections.map((connection) => connection.exchangeName),
      exchangeConnectionCount: connections.length,
    };
  });
};
