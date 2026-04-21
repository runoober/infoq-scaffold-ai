import Taro from '@tarojs/taro';
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { getSystemThemeMode, subscribeSystemThemeMode } from '../../src/utils/theme';

const getAppBaseInfoMock = Taro.getAppBaseInfo as unknown as MockInstance<[], { theme?: string }>;
const getSystemInfoSyncMock = Taro.getSystemInfoSync as unknown as MockInstance<[], { theme?: string }>;
const onThemeChangeMock = Taro.onThemeChange as unknown as MockInstance<[(event: { theme?: string }) => void], void>;
const offThemeChangeMock = Taro.offThemeChange as unknown as MockInstance<[(event: { theme?: string }) => void], void>;

describe('theme', () => {
  beforeEach(() => {
    getAppBaseInfoMock.mockReset();
    getSystemInfoSyncMock.mockReset();
    onThemeChangeMock.mockReset();
    offThemeChangeMock.mockReset();
  });

  it('getSystemThemeMode should use app base info first', () => {
    getAppBaseInfoMock.mockReturnValue({ theme: 'dark' });

    expect(getSystemThemeMode()).toBe('dark');
    expect(Taro.getSystemInfoSync).not.toHaveBeenCalled();
  });

  it('getSystemThemeMode should fallback to system info when app base info throws', () => {
    getAppBaseInfoMock.mockImplementation(() => {
      throw new Error('unsupported');
    });
    getSystemInfoSyncMock.mockReturnValue({ theme: 'dark' });

    expect(getSystemThemeMode()).toBe('dark');
  });

  it('getSystemThemeMode should fallback to light when both APIs throw', () => {
    getAppBaseInfoMock.mockImplementation(() => {
      throw new Error('unsupported');
    });
    getSystemInfoSyncMock.mockImplementation(() => {
      throw new Error('unsupported');
    });

    expect(getSystemThemeMode()).toBe('light');
  });

  it('subscribeSystemThemeMode should register and unregister callbacks', () => {
    let themeCallback: ((event: { theme?: string }) => void) | undefined;
    onThemeChangeMock.mockImplementation((cb: (event: { theme?: string }) => void) => {
      themeCallback = cb;
    });

    const listener = vi.fn();
    const unsubscribe = subscribeSystemThemeMode(listener);

    themeCallback?.({ theme: 'dark' });
    themeCallback?.({ theme: 'other' });

    expect(listener).toHaveBeenNthCalledWith(1, 'dark');
    expect(listener).toHaveBeenNthCalledWith(2, 'light');

    unsubscribe();
    expect(Taro.offThemeChange).toHaveBeenCalledTimes(1);
  });

  it('subscribeSystemThemeMode should swallow unsupported runtime errors', () => {
    onThemeChangeMock.mockImplementation(() => {
      throw new Error('unsupported');
    });

    const unsubscribe = subscribeSystemThemeMode(() => {});

    expect(() => unsubscribe()).not.toThrow();
  });

  it('unsubscribe should swallow offThemeChange errors', () => {
    onThemeChangeMock.mockImplementation(() => {});
    offThemeChangeMock.mockImplementation(() => {
      throw new Error('teardown failed');
    });

    const unsubscribe = subscribeSystemThemeMode(() => {});

    expect(() => unsubscribe()).not.toThrow();
  });
});
