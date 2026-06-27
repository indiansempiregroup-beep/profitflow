# ProfitFlow Backend

This service is the backend foundation for ProfitFlow. It is intentionally focused on infrastructure, configuration, database scaffolding, and runtime reliability.

## Included foundation

- Fastify bootstrap with security plugins
- Centralized configuration using Zod
- Pino-based structured logging
- Centralized error handling
- Dependency injection container
- Prisma schema and initial migration for Neon PostgreSQL
- Health and readiness endpoints
- Graceful shutdown handling

## Development

1. Set DATABASE_URL in your environment.
2. Run `pnpm --filter @profitflow/server prisma:generate`
3. Run `pnpm --filter @profitflow/server prisma:migrate`
4. Start the backend with `pnpm --filter @profitflow/server dev`
