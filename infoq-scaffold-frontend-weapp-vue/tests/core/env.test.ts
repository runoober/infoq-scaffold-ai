import { afterEach, describe, expect, it, vi } from 'vitest';

type EnvFixture = {
  compileEnv?: Record<string, unknown>;
  systemInfo?: Record<string, unknown>;
  throwOnSystemInfo?: boolean;
};

const loadEnvModule = async ({ compileEnv, systemInfo, throwOnSystemInfo = false }: EnvFixture) => {
  vi.resetModules();

  if (compileEnv === undefined) {
    delete (globalThis as Record<string, unknown>).__INFOQ_COMPILE_ENV__;
  } else {
    Object.defineProperty(globalThis, '__INFOQ_COMPILE_ENV__', {
      value: compileEnv,
      writable: true,
      configurable: true
    });
  }

  const getSystemInfoSync = vi.fn(() => {
    if (throwOnSystemInfo) {
      throw new Error('runtime-getSystemInfoSync-failed');
    }
    return systemInfo || {};
  });

  const runtime = globalThis as { uni?: Record<string, unknown> };
  runtime.uni = {
    ...(runtime.uni || {}),
    getSystemInfoSync
  };

  return import('../../src/utils/env');
};

afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as Record<string, unknown>).__INFOQ_COMPILE_ENV__;
});

describe('env', () => {
  it('should normalize runtime UNI_PLATFORM=web to h5', async () => {
    vi.stubEnv('UNI_PLATFORM', 'web');
    const { mobileEnv } = await loadEnvModule({
      compileEnv: {
        TARO_ENV: 'weapp'
      },
      systemInfo: {
        uniPlatform: 'mp-weixin'
      }
    });

    expect(mobileEnv.taroEnv).toBe('h5');
  });

  it('should prefer runtime UNI_PLATFORM over system info and compile TARO_ENV', async () => {
    vi.stubEnv('UNI_PLATFORM', 'mp-weixin');
    const { mobileEnv } = await loadEnvModule({
      compileEnv: {
        TARO_ENV: 'h5'
      },
      systemInfo: {
        uniPlatform: 'web'
      }
    });

    expect(mobileEnv.taroEnv).toBe('weapp');
  });

  it('should read compile env and normalize runtime mp-weixin to weapp', async () => {
    const { mobileEnv } = await loadEnvModule({
      compileEnv: {
        TARO_APP_TITLE: 'Custom Title',
        TARO_APP_COPYRIGHT: 'custom-copyright',
        TARO_APP_BASE_API: '/api-base',
        TARO_APP_MINI_BASE_API: '/mini-base',
        TARO_APP_API_ORIGIN: 'https://api.example.com/',
        TARO_APP_ENCRYPT: '1',
        TARO_APP_CLIENT_ID: 'cid-1'
      },
      systemInfo: {
        uniPlatform: 'mp-weixin'
      }
    });

    expect(mobileEnv.title).toBe('Custom Title');
    expect(mobileEnv.copyright).toBe('custom-copyright');
    expect(mobileEnv.baseApi).toBe('/api-base');
    expect(mobileEnv.miniBaseApi).toBe('/mini-base');
    expect(mobileEnv.apiOrigin).toBe('https://api.example.com/');
    expect(mobileEnv.encrypt).toBe(true);
    expect(mobileEnv.clientId).toBe('cid-1');
    expect(mobileEnv.taroEnv).toBe('weapp');
  });

  it('should fallback to compile TARO_ENV after runtime probe throws', async () => {
    const { mobileEnv } = await loadEnvModule({
      compileEnv: {
        TARO_ENV: 'weapp',
        TARO_APP_BASE_API: '/fallback-base'
      },
      throwOnSystemInfo: true
    });

    expect(mobileEnv.taroEnv).toBe('weapp');
    expect(mobileEnv.miniBaseApi).toBe('/fallback-base');
  });

  it('should fallback to default h5 when runtime probe throws and compile TARO_ENV is missing', async () => {
    const { mobileEnv } = await loadEnvModule({
      compileEnv: {
        TARO_APP_BASE_API: '/fallback-base-without-taro-env'
      },
      throwOnSystemInfo: true
    });

    expect(mobileEnv.taroEnv).toBe('h5');
  });

  it('should fallback to defaults when compile env is empty or invalid', async () => {
    const { mobileEnv } = await loadEnvModule({
      compileEnv: {
        TARO_APP_TITLE: '',
        TARO_APP_COPYRIGHT: null as unknown as string,
        TARO_APP_BASE_API: '',
        TARO_APP_ENCRYPT: 'false'
      },
      throwOnSystemInfo: true
    });

    expect(mobileEnv.title).toBe('InfoQ Mobile');
    expect(mobileEnv.copyright).toBe('Copyright © 2018-2026 Pontus All Rights Reserved.');
    expect(mobileEnv.baseApi).toBe('/dev-api');
    expect(mobileEnv.encrypt).toBe(false);
    expect(mobileEnv.taroEnv).toBe('h5');
  });

  it('should handle missing compile env object', async () => {
    const { mobileEnv } = await loadEnvModule({
      compileEnv: undefined,
      systemInfo: { uniPlatform: 'mp-weixin' }
    });

    expect(mobileEnv.title).toBe('InfoQ Mobile');
    expect(mobileEnv.baseApi).toBe('/dev-api');
    expect(mobileEnv.miniBaseApi).toBe('');
    expect(mobileEnv.taroEnv).toBe('weapp');
  });
});
