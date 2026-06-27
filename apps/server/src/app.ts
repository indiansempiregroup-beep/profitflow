import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';
import { fastify } from 'fastify';
import { env } from '@/config/env.js';
import { createLogger } from '@/config/logger.js';
import { healthRoutes } from '@/api/routes/health.js';
import { errorHandler } from '@/api/plugins/error-handler.js';
import { registerDependencyInjection } from '@/api/plugins/di.js';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: createLogger(),
    trustProxy: true,
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
  });

  await registerDependencyInjection(app);
  app.setErrorHandler(errorHandler);
  await app.register(healthRoutes, { prefix: env.API_PREFIX });

  return app;
};
