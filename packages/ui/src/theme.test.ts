import { describe, expect, it } from 'vitest';
import { designTokens } from './theme';

describe('ui theme tokens', () => {
  it('exposes core palette tokens', () => {
    expect(designTokens.colors.primary).toBe('#5B8DEF');
    expect(designTokens.colors.background).toBe('#0B0F19');
    expect(designTokens.spacing.lg).toBe(16);
    expect(designTokens.radius.md).toBe(16);
    expect(designTokens.typography.size.base).toBe(16);
  });
});
