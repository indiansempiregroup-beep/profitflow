import { createLogger } from '@/config/logger.js';
import { PrismaClient } from '@prisma/client';

export interface AppContainer {
  logger: ReturnType<typeof createLogger>;
  prisma: PrismaClient;
}

export const createContainer = (): AppContainer => {
  const logger = createLogger();
  const prisma = new PrismaClient();

  return { logger, prisma };
};
