const jsencryptMocks = vi.hoisted(() => {
  return {
    setPublicKey: vi.fn(),
    encrypt: vi.fn(() => 'cipher-text'),
    setPrivateKey: vi.fn(),
    decrypt: vi.fn(() => 'plain-text')
  };
});

vi.mock('jsencrypt', () => {
  class MockJSEncrypt {
    setPublicKey(key: string) {
      jsencryptMocks.setPublicKey(key);
    }
    encrypt(txt: string) {
      return jsencryptMocks.encrypt(txt);
    }
    setPrivateKey(key: string) {
      jsencryptMocks.setPrivateKey(key);
    }
    decrypt(txt: string) {
      return jsencryptMocks.decrypt(txt);
    }
  }

  return {
    default: MockJSEncrypt
  };
});

import { decrypt, encrypt } from '@/utils/jsencrypt';

describe('utils/jsencrypt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encrypts text using public key', () => {
    const result = encrypt('hello');
    expect(result).toBe('cipher-text');
    expect(jsencryptMocks.setPublicKey).toHaveBeenCalledTimes(1);
    expect(jsencryptMocks.encrypt).toHaveBeenCalledWith('hello');
  });

  it('decrypts text using private key', () => {
    const result = decrypt('cipher');
    expect(result).toBe('plain-text');
    expect(jsencryptMocks.setPrivateKey).toHaveBeenCalledTimes(1);
    expect(jsencryptMocks.decrypt).toHaveBeenCalledWith('cipher');
  });
});
