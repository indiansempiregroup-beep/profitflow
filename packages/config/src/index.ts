export const appConfig = {
  env: process.env.NODE_ENV ?? 'development',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3000',
  appName: 'ProfitFlow',
} as const;
