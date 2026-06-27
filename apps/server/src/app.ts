import { fastify, type FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { healthCheckRoute } from './config/health.js';
import { loggerConfig } from './config/logger.js';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: env.NODE_ENV !== 'test' ? loggerConfig : false,
    trustProxy: true,
  });

  app.get(healthCheckRoute, async () => ({ status: 'ok' }));
  app.get(`/api${healthCheckRoute}`, async () => ({ status: 'ok' }));

  return app;
};
