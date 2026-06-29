import { describe, expect, it } from 'vitest';

import { env } from './env.js';

describe('server env config', () => {
  it('provides a default port', () => {
    expect(env.PORT).toBeGreaterThan(0);
  });
});
