const parseBoolean = (value?: string) => value === 'true' || value === '1';

export const mobileEnv = {
  title: process.env.TARO_APP_TITLE || 'InfoQ Mobile',
  copyright: process.env.TARO_APP_COPYRIGHT || 'Copyright © 2018-2026 Pontus All Rights Reserved.',
  baseApi: process.env.TARO_APP_BASE_API || '/dev-api',
  miniBaseApi: process.env.TARO_APP_MINI_BASE_API ?? process.env.TARO_APP_BASE_API ?? '',
  apiOrigin: process.env.TARO_APP_API_ORIGIN || '',
  encrypt: parseBoolean(process.env.TARO_APP_ENCRYPT),
  rsaPublicKey: process.env.TARO_APP_RSA_PUBLIC_KEY || '',
  rsaPrivateKey: process.env.TARO_APP_RSA_PRIVATE_KEY || '',
  clientId: process.env.TARO_APP_CLIENT_ID || '',
  taroEnv: process.env.TARO_ENV || 'h5'
};

export const isH5 = () => mobileEnv.taroEnv === 'h5';
