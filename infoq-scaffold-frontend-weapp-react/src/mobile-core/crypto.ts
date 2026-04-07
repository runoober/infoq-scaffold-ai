import * as aesjs from 'aes-js';

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let index = 0; index < 32; index += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const utf8ToBytes = (value: string) => Uint8Array.from(aesjs.utils.utf8.toBytes(value));

const bytesToUtf8 = (value: Uint8Array) => aesjs.utils.utf8.fromBytes(Array.from(value));

const bytesToBase64 = (value: Uint8Array) => {
  let result = '';
  for (let index = 0; index < value.length; index += 3) {
    const byte1 = value[index];
    const byte2 = index + 1 < value.length ? value[index + 1] : 0;
    const byte3 = index + 2 < value.length ? value[index + 2] : 0;
    const chunk = (byte1 << 16) | (byte2 << 8) | byte3;

    result += base64Alphabet[(chunk >> 18) & 63];
    result += base64Alphabet[(chunk >> 12) & 63];
    result += index + 1 < value.length ? base64Alphabet[(chunk >> 6) & 63] : '=';
    result += index + 2 < value.length ? base64Alphabet[chunk & 63] : '=';
  }
  return result;
};

const base64ToBytes = (value: string) => {
  const sanitized = value.replace(/\s+/g, '').replace(/=+$/, '');
  if (!sanitized) {
    return new Uint8Array(0);
  }

  const bytes: number[] = [];
  for (let index = 0; index < sanitized.length; index += 4) {
    const chunk = sanitized.slice(index, index + 4);
    const encoded = chunk.padEnd(4, 'A');
    const char1 = base64Alphabet.indexOf(encoded[0]);
    const char2 = base64Alphabet.indexOf(encoded[1]);
    const char3 = base64Alphabet.indexOf(encoded[2]);
    const char4 = base64Alphabet.indexOf(encoded[3]);

    const packed = (char1 << 18) | (char2 << 12) | ((char3 & 63) << 6) | (char4 & 63);
    bytes.push((packed >> 16) & 255);
    if (chunk.length > 2) {
      bytes.push((packed >> 8) & 255);
    }
    if (chunk.length > 3) {
      bytes.push(packed & 255);
    }
  }
  return Uint8Array.from(bytes);
};

export const generateAesKey = () => generateRandomString();

export const encryptBase64 = (value: string) => bytesToBase64(utf8ToBytes(value));

export const decryptBase64 = (value: string) => bytesToUtf8(base64ToBytes(value));

const createEcbCipher = (aesKey: string) => new aesjs.ModeOfOperation.ecb(utf8ToBytes(aesKey));

export const encryptWithAes = (message: string, aesKey: string) => {
  const cipher = createEcbCipher(aesKey);
  const padded = aesjs.padding.pkcs7.pad(utf8ToBytes(message));
  return bytesToBase64(Uint8Array.from(cipher.encrypt(padded)));
};

export const decryptWithAes = (message: string, aesKey: string) => {
  const cipher = createEcbCipher(aesKey);
  const encryptedBytes = base64ToBytes(message);
  const decrypted = cipher.decrypt(encryptedBytes);
  return bytesToUtf8(Uint8Array.from(aesjs.padding.pkcs7.strip(decrypted)));
};
