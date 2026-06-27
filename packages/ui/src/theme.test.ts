import { describe, expect, it } from 'vitest';
import { designTokens } from './theme';

describe('ui theme tokens', () => {
  it('exposes core palette tokens', () => {
    expect(designTokens.colors.primary).toBe('#2563eb');
    expect(designTokens.spacing.lg).toBe(16);
  });
});
