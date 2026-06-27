import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\/(.*)$/,
        replacement: fileURLToPath(new URL('./src/$1', import.meta.url)),
      },
      {
        find: '@profitflow/shared',
        replacement: fileURLToPath(new URL('../../packages/shared/src', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
  },
});
