import { fastify } from 'fastify';

const server = fastify({ logger: true });

server.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT || 3000), host: '0.0.0.0' });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

void start();
