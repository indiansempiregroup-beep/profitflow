import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';
import { fastify } from 'fastify';
import { env } from '@/config/env.js';
import { healthRoutes } from '@/api/routes/health.js';
import { dashboardRoutes } from '@/api/routes/dashboard.js';
import { dashboardWebSocketRoutes } from '@/api/routes/dashboard-ws.js';
import { authRoutes } from '@/api/routes/auth.js';
import { profileRoutes } from '@/api/routes/profile.js';
import { exchangeConnectionRoutes } from '@/api/routes/exchange-connections.js';
import { portfolioRoutes } from '@/api/routes/portfolio.js';
import { paperTradeRoutes } from '@/api/routes/paper-trades.js';
import { notificationRoutes } from '@/api/routes/notifications.js';
import { errorHandler } from '@/api/plugins/error-handler.js';
import { registerDependencyInjection } from '@/api/plugins/di.js';
import websocketPlugin from '@fastify/websocket';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    // Use Fastify's built-in logger for runtime stability here.
    logger: true,
    trustProxy: true,
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
  });

  await registerDependencyInjection(app);
  await app.register(websocketPlugin);
  app.setErrorHandler(errorHandler);
  await app.register(healthRoutes, { prefix: env.API_PREFIX });
  await app.register(authRoutes, { prefix: env.API_PREFIX });
  await app.register(profileRoutes, { prefix: env.API_PREFIX });
  await app.register(exchangeConnectionRoutes, { prefix: env.API_PREFIX });
  await app.register(portfolioRoutes, { prefix: env.API_PREFIX });
  await app.register(paperTradeRoutes, { prefix: env.API_PREFIX });
  await app.register(notificationRoutes, { prefix: env.API_PREFIX });
  await app.register(dashboardRoutes, { prefix: env.API_PREFIX });
  await app.register(dashboardWebSocketRoutes, { prefix: env.API_PREFIX });

  return app;
};
