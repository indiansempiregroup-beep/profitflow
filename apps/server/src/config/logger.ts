export const loggerConfig = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['authorization', 'cookie', 'set-cookie', 'x-api-key'],
};
