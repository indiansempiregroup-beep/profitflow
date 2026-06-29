import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/database/client.js';
import { verifyAccessToken } from '@/core/auth.js';

const registerPushTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.string().min(2),
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

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/notifications', async (request, reply) => {
    const userId = getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        read: notification.read,
        data: notification.data,
        createdAt: notification.createdAt.toISOString(),
      })),
    };
  });

  fastify.post('/notifications/:id/read', async (request, reply) => {
    const userId = getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const notificationId = String((request.params as { id: string }).id);
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      return reply
        .status(404)
        .send({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found.' } });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return { success: true };
  });

  fastify.post('/notifications/read-all', async (request, reply) => {
    const userId = getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { success: true };
  });

  fastify.post('/push-tokens', async (request, reply) => {
    const userId = getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const body = registerPushTokenSchema.parse(request.body);
    await prisma.pushToken.upsert({
      where: { token: body.token },
      update: { userId, platform: body.platform },
      create: { userId, token: body.token, platform: body.platform },
    });

    return { success: true };
  });
};
