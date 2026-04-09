import Taro from '@tarojs/taro';

const parseBoolean = (value?: string) => value === 'true' || value === '1';

type RuntimeEnv = Record<string, string | undefined>;

declare const __INFOQ_COMPILE_ENV__: RuntimeEnv | undefined;

const resolveCompileEnv = (): RuntimeEnv => {
  if (typeof __INFOQ_COMPILE_ENV__ === 'object' && __INFOQ_COMPILE_ENV__) {
    return __INFOQ_COMPILE_ENV__;
  }
  return {};
};

const normalizeTaroEnv = (value: unknown): string => {
  if (!value) {
    return '';
  }
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'web') {
    return 'h5';
  }
  return normalized;
};

const resolveRuntimeTaroEnv = (): string => {
  try {
    const runtimeEnv = Taro.getEnv();
    return normalizeTaroEnv(runtimeEnv);
  } catch {
    return '';
  }
};

const compileEnv = resolveCompileEnv();

const getOptionalEnv = (key: string): string | undefined => {
  const value = compileEnv[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
};

const getEnv = (key: string, fallback = ''): string => {
  const value = getOptionalEnv(key);
  if (value === undefined) {
    return fallback;
  }
  if (!value) {
    return fallback;
  }
  return value;
};

const resolveTaroEnv = (): string => {
  const runtimeEnv = resolveRuntimeTaroEnv();
  if (runtimeEnv) {
    return runtimeEnv;
  }
  const compileEnvValue = normalizeTaroEnv(getOptionalEnv('TARO_ENV'));
  if (compileEnvValue) {
    return compileEnvValue;
  }
  return 'h5';
};

const resolveMiniBaseApi = (): string => {
  const miniBaseApi = getOptionalEnv('TARO_APP_MINI_BASE_API');
  if (miniBaseApi !== undefined) {
    return miniBaseApi;
  }
  return getEnv('TARO_APP_BASE_API', '');
};

export const mobileEnv = {
  title: getEnv('TARO_APP_TITLE', 'InfoQ Mobile'),
  copyright: getEnv('TARO_APP_COPYRIGHT', 'Copyright © 2018-2026 Pontus All Rights Reserved.'),
  baseApi: getEnv('TARO_APP_BASE_API', '/dev-api'),
  miniBaseApi: resolveMiniBaseApi(),
  apiOrigin: getEnv('TARO_APP_API_ORIGIN', ''),
  encrypt: parseBoolean(getEnv('TARO_APP_ENCRYPT', '')),
  rsaPublicKey: getEnv('TARO_APP_RSA_PUBLIC_KEY', ''),
  rsaPrivateKey: getEnv('TARO_APP_RSA_PRIVATE_KEY', ''),
  clientId: getEnv('TARO_APP_CLIENT_ID', ''),
  get taroEnv() {
    return resolveTaroEnv();
  }
};
