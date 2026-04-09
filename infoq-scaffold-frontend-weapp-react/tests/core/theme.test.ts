import Taro from '@tarojs/taro';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSystemThemeMode, subscribeSystemThemeMode } from '../../src/utils/theme';

describe('theme', () => {
  beforeEach(() => {
    (Taro.getAppBaseInfo as any).mockReset();
    (Taro.getSystemInfoSync as any).mockReset();
    (Taro.onThemeChange as any).mockReset();
    (Taro.offThemeChange as any).mockReset();
  });

  it('getSystemThemeMode should use app base info first', () => {
    (Taro.getAppBaseInfo as any).mockReturnValue({ theme: 'dark' });

    expect(getSystemThemeMode()).toBe('dark');
    expect(Taro.getSystemInfoSync).not.toHaveBeenCalled();
  });

  it('getSystemThemeMode should fallback to system info when app base info throws', () => {
    (Taro.getAppBaseInfo as any).mockImplementation(() => {
      throw new Error('unsupported');
    });
    (Taro.getSystemInfoSync as any).mockReturnValue({ theme: 'dark' });

    expect(getSystemThemeMode()).toBe('dark');
  });

  it('getSystemThemeMode should fallback to light when both APIs throw', () => {
    (Taro.getAppBaseInfo as any).mockImplementation(() => {
      throw new Error('unsupported');
    });
    (Taro.getSystemInfoSync as any).mockImplementation(() => {
      throw new Error('unsupported');
    });

    expect(getSystemThemeMode()).toBe('light');
  });

  it('subscribeSystemThemeMode should register and unregister callbacks', () => {
    let themeCallback: ((event: { theme?: string }) => void) | undefined;
    (Taro.onThemeChange as any).mockImplementation((cb: (event: { theme?: string }) => void) => {
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
    (Taro.onThemeChange as any).mockImplementation(() => {
      throw new Error('unsupported');
    });

    const unsubscribe = subscribeSystemThemeMode(() => {});

    expect(() => unsubscribe()).not.toThrow();
  });

  it('unsubscribe should swallow offThemeChange errors', () => {
    (Taro.onThemeChange as any).mockImplementation(() => {});
    (Taro.offThemeChange as any).mockImplementation(() => {
      throw new Error('teardown failed');
    });

    const unsubscribe = subscribeSystemThemeMode(() => {});

    expect(() => unsubscribe()).not.toThrow();
  });
});
