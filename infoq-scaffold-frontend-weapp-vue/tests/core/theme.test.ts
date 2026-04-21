import { describe, expect, it, type Mock } from 'vitest';
import { getSystemThemeMode, subscribeSystemThemeMode } from '../../src/utils/theme';

describe('theme', () => {
  it('getSystemThemeMode should read system theme', () => {
    (uni.getSystemInfoSync as unknown as Mock).mockReturnValue({ theme: 'dark' });
    expect(getSystemThemeMode()).toBe('dark');
  });

  it('getSystemThemeMode should fallback to light when api throws', () => {
    (uni.getSystemInfoSync as unknown as Mock).mockImplementation(() => {
      throw new Error('getSystemInfoSync failed');
    });

    expect(getSystemThemeMode()).toBe('light');
  });

  it('subscribeSystemThemeMode should register and teardown listener', () => {
    const listeners: Array<(event: { theme?: string }) => void> = [];
    (uni.onThemeChange as unknown as Mock).mockImplementation((cb: (event: { theme?: string }) => void) => {
      listeners.push(cb);
    });

    const received: string[] = [];
    const unsubscribe = subscribeSystemThemeMode((mode) => {
      received.push(mode);
    });

    expect(typeof unsubscribe).toBe('function');
    expect(listeners.length).toBe(1);
    const handler = listeners[0];
    if (!handler) {
      throw new Error('theme change handler should be registered');
    }
    handler({ theme: 'dark' });
    handler({ theme: 'light' });

    expect(received).toEqual(['dark', 'light']);

    unsubscribe();
    expect(uni.offThemeChange).toHaveBeenCalledTimes(1);
  });

  it('subscribeSystemThemeMode should return noop when register throws', () => {
    (uni.onThemeChange as unknown as Mock).mockImplementation(() => {
      throw new Error('onThemeChange failed');
    });

    const unsubscribe = subscribeSystemThemeMode(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('unsubscribe should swallow offThemeChange errors', () => {
    (uni.onThemeChange as unknown as Mock).mockImplementation(() => {});
    (uni.offThemeChange as unknown as Mock).mockImplementation(() => {
      throw new Error('offThemeChange failed');
    });

    const unsubscribe = subscribeSystemThemeMode(() => {});
    expect(() => unsubscribe()).not.toThrow();
  });
});
