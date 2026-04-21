const parseBoolean = (value?: string) => value === 'true' || value === '1';

type RuntimeEnv = Record<string, string | undefined>;
type RuntimeProcess = { process?: { env?: Record<string, unknown> } };
type ImportMetaWithEnv = ImportMeta & { env?: Record<string, unknown> };

declare const __INFOQ_COMPILE_ENV__: RuntimeEnv | undefined;
const runtimeProcessEnv = (globalThis as RuntimeProcess).process?.env;

const resolveImportMetaEnv = (): Record<string, unknown> | undefined => (import.meta as ImportMetaWithEnv).env;

const resolveCompileEnv = (): RuntimeEnv => {
  if (typeof __INFOQ_COMPILE_ENV__ === 'object' && __INFOQ_COMPILE_ENV__) {
    return __INFOQ_COMPILE_ENV__;
  }
  return {};
};

const normalizeRuntimeEnv = (value: unknown): string => {
  if (!value) {
    return '';
  }
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'mp-weixin') {
    return 'weapp';
  }
  if (normalized === 'web') {
    return 'h5';
  }
  return normalized;
};

const resolveRuntimeTaroEnv = (): string => {
  const importMetaEnv = resolveImportMetaEnv();
  const viteEnv = normalizeRuntimeEnv(runtimeProcessEnv?.UNI_PLATFORM ?? importMetaEnv?.UNI_PLATFORM);
  if (viteEnv) {
    return viteEnv;
  }
  try {
    const system = uni.getSystemInfoSync?.();
    const platform = normalizeRuntimeEnv((system as { uniPlatform?: string } | undefined)?.uniPlatform);
    if (platform) {
      return platform;
    }
  } catch {
    // Ignore runtime probe errors.
  }
  return '';
};

const compileEnv = resolveCompileEnv();

const getOptionalEnv = (key: string): string | undefined => {
  const importMetaEnv = resolveImportMetaEnv();
  const value = compileEnv[key] ?? runtimeProcessEnv?.[key] ?? importMetaEnv?.[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
};

const getEnv = (key: string, fallback = ''): string => {
  const value = getOptionalEnv(key);
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
};

const resolveTaroEnv = (): string => {
  const runtimeEnv = resolveRuntimeTaroEnv();
  if (runtimeEnv) {
    return runtimeEnv;
  }
  const compileEnvValue = normalizeRuntimeEnv(getOptionalEnv('TARO_ENV'));
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
