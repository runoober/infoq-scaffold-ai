import { afterEach, describe, expect, it, vi } from 'vitest';

type EnvFixture = {
  compileEnv?: Record<string, unknown>;
  runtimeEnv?: unknown;
  throwOnGetEnv?: boolean;
};

const loadEnvModule = async ({ compileEnv, runtimeEnv, throwOnGetEnv = false }: EnvFixture) => {
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

  const getEnv = vi.fn(() => {
    if (throwOnGetEnv) {
      throw new Error('runtime-getEnv-failed');
    }
    return runtimeEnv;
  });

  vi.doMock('@tarojs/taro', () => ({
    default: {
      getEnv
    },
    getEnv
  }));

  return import('../../src/utils/env');
};

afterEach(() => {
  vi.doUnmock('@tarojs/taro');
  delete (globalThis as Record<string, unknown>).__INFOQ_COMPILE_ENV__;
});

describe('env', () => {
  it('should read compile env and normalize runtime web to h5', async () => {
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
      runtimeEnv: 'WEB'
    });

    expect(mobileEnv.title).toBe('Custom Title');
    expect(mobileEnv.copyright).toBe('custom-copyright');
    expect(mobileEnv.baseApi).toBe('/api-base');
    expect(mobileEnv.miniBaseApi).toBe('/mini-base');
    expect(mobileEnv.apiOrigin).toBe('https://api.example.com/');
    expect(mobileEnv.encrypt).toBe(true);
    expect(mobileEnv.clientId).toBe('cid-1');
    expect(mobileEnv.taroEnv).toBe('h5');
  });

  it('should fallback to compile TARO_ENV when runtime env lookup fails', async () => {
    const { mobileEnv } = await loadEnvModule({
      compileEnv: {
        TARO_ENV: 'weapp',
        TARO_APP_BASE_API: '/fallback-base'
      },
      throwOnGetEnv: true
    });

    expect(mobileEnv.taroEnv).toBe('weapp');
    expect(mobileEnv.miniBaseApi).toBe('/fallback-base');
  });

  it('should fallback to defaults when compile env is empty or invalid', async () => {
    const { mobileEnv } = await loadEnvModule({
      compileEnv: {
        TARO_APP_TITLE: '',
        TARO_APP_COPYRIGHT: null as unknown as string,
        TARO_APP_BASE_API: '',
        TARO_APP_ENCRYPT: 'false'
      },
      throwOnGetEnv: true
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
      runtimeEnv: 'weapp'
    });

    expect(mobileEnv.title).toBe('InfoQ Mobile');
    expect(mobileEnv.baseApi).toBe('/dev-api');
    expect(mobileEnv.miniBaseApi).toBe('');
    expect(mobileEnv.taroEnv).toBe('weapp');
  });
});
