import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from './index';

describe('shared package', () => {
  it('exports app metadata', () => {
    expect(APP_NAME).toBe('ProfitFlow');
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
