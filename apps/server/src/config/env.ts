import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().url().min(1),
  REDIS_URL: z.string().url().min(1).optional(),
  JWT_SECRET: z.string().min(10).default('dev-secret-change-me'),
  CREDENTIALS_ENCRYPTION_KEY: z.string().min(32).default('dev-credentials-encryption-key-32chars'),
  CORS_ORIGIN: z.string().default('*'),
});

export const env = envSchema.parse(process.env);
