import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
    manifest: null,
  },
}));

describe('mobile constants', () => {
  it('exposes the shared app name', async () => {
    const { APP_NAME } = await import('../constants');

    expect(APP_NAME).toBe('ProfitFlow');
  });
});
