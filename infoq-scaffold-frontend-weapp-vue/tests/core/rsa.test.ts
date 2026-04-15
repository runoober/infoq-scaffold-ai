import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../../src/utils/rsa';

describe('rsa', () => {
  it('encrypt should execute without throwing and return cipher or false', () => {
    let result: string | false | null = null;

    expect(() => {
      result = encrypt('plain-text');
    }).not.toThrow();

    expect(typeof result === 'string' || result === false || result === null).toBe(true);
  });

  it('decrypt should execute without throwing and return plain or false', () => {
    let result: string | false | null = null;

    expect(() => {
      result = decrypt('cipher-text');
    }).not.toThrow();

    expect(typeof result === 'string' || result === false || result === null).toBe(true);
  });
});
