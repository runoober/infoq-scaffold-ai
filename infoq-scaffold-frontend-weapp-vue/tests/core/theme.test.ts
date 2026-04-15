import { describe, expect, it } from 'vitest';
import { getSystemThemeMode, subscribeSystemThemeMode } from '../../src/utils/theme';

describe('theme', () => {
  it('getSystemThemeMode should read system theme', () => {
    (uni.getSystemInfoSync as any).mockReturnValue({ theme: 'dark' });
    expect(getSystemThemeMode()).toBe('dark');
  });

  it('getSystemThemeMode should fallback to light when api throws', () => {
    (uni.getSystemInfoSync as any).mockImplementation(() => {
      throw new Error('getSystemInfoSync failed');
    });

    expect(getSystemThemeMode()).toBe('light');
  });

  it('subscribeSystemThemeMode should register and teardown listener', () => {
    let captured: ((event: { theme?: string }) => void) | null = null;
    (uni.onThemeChange as any).mockImplementation((cb: (event: { theme?: string }) => void) => {
      captured = cb;
    });

    const received: string[] = [];
    const unsubscribe = subscribeSystemThemeMode((mode) => {
      received.push(mode);
    });

    expect(typeof unsubscribe).toBe('function');
    expect(captured).not.toBeNull();

    captured?.({ theme: 'dark' });
    captured?.({ theme: 'light' });

    expect(received).toEqual(['dark', 'light']);

    unsubscribe();
    expect(uni.offThemeChange).toHaveBeenCalledTimes(1);
  });

  it('subscribeSystemThemeMode should return noop when register throws', () => {
    (uni.onThemeChange as any).mockImplementation(() => {
      throw new Error('onThemeChange failed');
    });

    const unsubscribe = subscribeSystemThemeMode(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('unsubscribe should swallow offThemeChange errors', () => {
    (uni.onThemeChange as any).mockImplementation(() => {});
    (uni.offThemeChange as any).mockImplementation(() => {
      throw new Error('offThemeChange failed');
    });

    const unsubscribe = subscribeSystemThemeMode(() => {});
    expect(() => unsubscribe()).not.toThrow();
  });
});
