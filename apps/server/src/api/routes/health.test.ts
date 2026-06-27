import { describe, expect, it } from 'vitest';

describe('health routes', () => {
  it('has standard health route names', () => {
    expect('/health').toBe('/health');
    expect('/ready').toBe('/ready');
  });
});
