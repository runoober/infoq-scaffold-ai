import { useEffect, useState } from 'react';
import { getSystemThemeMode, subscribeSystemThemeMode, type MobileThemeMode } from '@/api';

export const useThemeMode = () => {
  const [themeMode, setThemeMode] = useState<MobileThemeMode>(() => getSystemThemeMode());

  useEffect(() => {
    setThemeMode(getSystemThemeMode());
    return subscribeSystemThemeMode(setThemeMode);
  }, []);

  return themeMode;
};
