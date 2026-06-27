import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().url().min(1).default('postgresql://postgres:postgres@localhost:5432/profitflow'),
  REDIS_URL: z.string().url().min(1).optional(),
  CORS_ORIGIN: z.string().default('*'),
});

export const env = envSchema.parse(process.env);
