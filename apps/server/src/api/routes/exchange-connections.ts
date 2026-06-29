import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/database/client.js';
import { verifyAccessToken } from '@/core/auth.js';
import {
  decryptCredentials,
  encryptCredentials,
  supportedExchanges,
  validateExchangeCredentials,
  type ExchangeCredentialPayload,
  type SupportedExchangeName,
} from '@/services/exchange-credentials.js';

const connectionSchema = z.object({
  exchangeName: z.enum(['Binance', 'CoinDCX', 'Bybit', 'OKX']),
  apiKey: z.string().min(8, 'API key is required.'),
  secretKey: z.string().min(8, 'Secret key is required.'),
  passphrase: z.string().optional(),
});

const getAuthenticatedUserId = async (
  authorization: string | undefined,
): Promise<string | null> => {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
    return null;
  }

  const userId = String((payload as { sub: string }).sub);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? userId : null;
};

const toCredentialPayload = (
  body: z.infer<typeof connectionSchema>,
): ExchangeCredentialPayload => ({
  apiKey: body.apiKey,
  secretKey: body.secretKey,
  passphrase: body.passphrase,
  permissions: ['read-only'],
});

export const exchangeConnectionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/exchange-connections', async (request, reply) => {
    const userId = await getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const connections = await prisma.exchangeConnection.findMany({
      where: { userId },
      orderBy: { exchangeName: 'asc' },
    });

    return {
      success: true,
      connections: connections.map((connection) => ({
        id: connection.id,
        exchangeName: connection.exchangeName,
      })),
      supportedExchanges,
    };
  });

  fastify.post('/exchange-connections/test', async (request, reply) => {
    const userId = await getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const body = connectionSchema.parse(request.body);
    const credentials = toCredentialPayload(body);

    try {
      await validateExchangeCredentials(body.exchangeName, credentials);
      return {
        success: true,
        message: `${body.exchangeName} credentials verified successfully.`,
      };
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message:
            error instanceof Error ? error.message : 'Exchange credentials could not be verified.',
        },
      });
    }
  });

  fastify.post('/exchange-connections', async (request, reply) => {
    const userId = await getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const body = connectionSchema.parse(request.body);
    const credentials = toCredentialPayload(body);

    try {
      await validateExchangeCredentials(body.exchangeName, credentials);
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message:
            error instanceof Error ? error.message : 'Exchange credentials could not be verified.',
        },
      });
    }

    const encrypted = encryptCredentials(credentials);
    const connection = await prisma.exchangeConnection.upsert({
      where: {
        userId_exchangeName: {
          userId,
          exchangeName: body.exchangeName,
        },
      },
      update: {
        credentials: encrypted,
      },
      create: {
        userId,
        exchangeName: body.exchangeName,
        credentials: encrypted,
      },
    });

    return {
      success: true,
      connection: {
        id: connection.id,
        exchangeName: connection.exchangeName,
      },
    };
  });

  fastify.delete('/exchange-connections/:exchangeName', async (request, reply) => {
    const userId = await getAuthenticatedUserId(request.headers.authorization);
    if (!userId) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const exchangeName = String(
      (request.params as { exchangeName: string }).exchangeName,
    ) as SupportedExchangeName;
    if (!supportedExchanges.includes(exchangeName)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_EXCHANGE', message: 'Unsupported exchange.' },
      });
    }

    await prisma.exchangeConnection.deleteMany({
      where: { userId, exchangeName },
    });

    return { success: true };
  });
};

export async function loadUserExchangeCredentials(
  userId: string,
): Promise<Array<{ exchangeName: SupportedExchangeName; credentials: ExchangeCredentialPayload }>> {
  const connections = await prisma.exchangeConnection.findMany({ where: { userId } });
  return connections
    .map((connection) => {
      try {
        return {
          exchangeName: connection.exchangeName as SupportedExchangeName,
          credentials: decryptCredentials(connection.credentials),
        };
      } catch {
        return null;
      }
    })
    .filter(
      (
        entry,
      ): entry is { exchangeName: SupportedExchangeName; credentials: ExchangeCredentialPayload } =>
        entry !== null,
    );
}
