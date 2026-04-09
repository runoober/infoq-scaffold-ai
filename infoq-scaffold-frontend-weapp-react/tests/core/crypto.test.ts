import { describe, expect, it } from 'vitest';
import {
  decryptBase64,
  decryptWithAes,
  encryptBase64,
  encryptWithAes,
  generateAesKey
} from '../../src/utils/crypto';

describe('crypto', () => {
  it('generateAesKey should produce 32-char alphanumeric key', () => {
    const key = generateAesKey();
    expect(key).toHaveLength(32);
    expect(key).toMatch(/^[A-Za-z0-9]{32}$/);
  });

  it('base64 helpers should support multiple chunk lengths', () => {
    const inputs = ['', 'a', 'ab', 'abc', 'hello world'];

    for (const input of inputs) {
      const encoded = encryptBase64(input);
      const decoded = decryptBase64(encoded);
      expect(decoded).toBe(input);
    }

    expect(decryptBase64('YQ==')).toBe('a');
    expect(decryptBase64('YWI=')).toBe('ab');
    expect(decryptBase64('YWJj')).toBe('abc');
  });

  it('aes helpers should encrypt and decrypt consistently', () => {
    const key = 'A1234567890BCDEF1234567890ABCDEF';
    const plaintext = JSON.stringify({ hello: 'world', value: 123 });

    const encrypted = encryptWithAes(plaintext, key);
    const decrypted = decryptWithAes(encrypted, key);

    expect(encrypted).not.toBe(plaintext);
    expect(decrypted).toBe(plaintext);
  });
});
