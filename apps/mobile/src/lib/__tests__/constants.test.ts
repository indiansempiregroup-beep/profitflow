import { describe, expect, it } from 'vitest';
import { APP_NAME } from '../constants';

describe('mobile constants', () => {
  it('exposes the shared app name', () => {
    expect(APP_NAME).toBe('ProfitFlow');
  });
});
