export type MobileThemeMode = 'light' | 'dark';

const normalizeThemeMode = (theme?: string | null): MobileThemeMode => (theme === 'dark' ? 'dark' : 'light');

export const getSystemThemeMode = (): MobileThemeMode => {
  try {
    const info = uni.getSystemInfoSync?.();
    return normalizeThemeMode((info as { theme?: string } | undefined)?.theme);
  } catch {
    return 'light';
  }
};

export const subscribeSystemThemeMode = (listener: (themeMode: MobileThemeMode) => void) => {
  const callback = (event: { theme?: string }) => {
    listener(normalizeThemeMode(event?.theme));
  };

  try {
    uni.onThemeChange?.(callback as UniNamespace.OnThemeChangeCallback);
    return () => {
      try {
        uni.offThemeChange?.(callback as UniNamespace.OnThemeChangeCallback);
      } catch {
        // Ignore teardown errors so theme subscription never breaks page unmount.
      }
    };
  } catch {
    return () => {};
  }
};
