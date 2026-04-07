import Taro from '@tarojs/taro';

export type MobileThemeMode = 'light' | 'dark';

const normalizeThemeMode = (theme?: string | null): MobileThemeMode => (theme === 'dark' ? 'dark' : 'light');

export const getSystemThemeMode = (): MobileThemeMode => {
  try {
    return normalizeThemeMode(Taro.getAppBaseInfo().theme);
  } catch {
    try {
      return normalizeThemeMode(Taro.getSystemInfoSync().theme);
    } catch {
      return 'light';
    }
  }
};

export const subscribeSystemThemeMode = (listener: (themeMode: MobileThemeMode) => void) => {
  const callback: Parameters<typeof Taro.onThemeChange>[0] = (event) => {
    listener(normalizeThemeMode(event.theme));
  };

  try {
    Taro.onThemeChange(callback);
    return () => {
      try {
        Taro.offThemeChange(callback);
      } catch {
        // Ignore teardown errors so theme subscription never breaks page unmount.
      }
    };
  } catch {
    return () => {};
  }
};
