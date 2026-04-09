import JSEncrypt from 'jsencrypt';
import { mobileEnv } from './env';

export const encrypt = (value: string) => {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(mobileEnv.rsaPublicKey);
  return encryptor.encrypt(value);
};

export const decrypt = (value: string) => {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(mobileEnv.rsaPrivateKey);
  return encryptor.decrypt(value);
};
