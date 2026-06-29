import { describe, expect, it } from 'vitest';
import { decryptJson, encryptJson } from './crypto.js';

describe('credential crypto', () => {
  it('encrypts and decrypts credential payloads', () => {
    const payload = {
      apiKey: 'test-key',
      secretKey: 'test-secret',
      permissions: ['read-only'],
    };

    const encrypted = encryptJson(payload);
    expect(encrypted).not.toContain('test-key');
    expect(decryptJson<typeof payload>(encrypted)).toEqual(payload);
  });
});
