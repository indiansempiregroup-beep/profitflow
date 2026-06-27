import type { FastifyInstance } from 'fastify';
import { createContainer } from '@/core/container.js';

export const registerDependencyInjection = async (app: FastifyInstance) => {
  const container = createContainer();
  app.decorate('container', container);
};
