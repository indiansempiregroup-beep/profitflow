import 'dotenv/config';

import { buildApp } from '@/app.js';
import { env } from '@/config/env.js';
import { prisma } from '@/database/client.js';
import { initializeRuntime } from '@/runtime.js';

const start = async () => {
  const app = await buildApp();
  let runtime: { stop: () => Promise<void> } | null = null;

  const shutdown = async (signal: string, exitCode = 0) => {
    app.log.info({ signal }, 'Shutting down server');

    if (runtime) {
      await runtime.stop();
    }

    await app.close();
    await prisma.$disconnect();
    process.exit(exitCode);
  };

  try {
    runtime = await initializeRuntime(app);
    app.decorate('runtimeServices', runtime);
  } catch (error) {
    app.log.error({ error }, 'Runtime initialization failed');
    await shutdown('INIT_FAILURE', 1);
    return;
  }

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
