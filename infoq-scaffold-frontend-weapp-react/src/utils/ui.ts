import Taro from '@tarojs/taro';
import { isAuthError, toErrorMessage } from '@/api';
import { relaunch, routes } from './navigation';

export const showSuccess = (title: string) => Taro.showToast({ title, icon: 'success' });

const showError = (error: unknown, fallback?: string) =>
  Taro.showToast({
    title: toErrorMessage(error, fallback),
    icon: 'none',
    duration: 2200
  });

export const handlePageError = async (error: unknown, fallback?: string) => {
  if (isAuthError(error)) {
    await showError(error, '登录状态已失效，请重新登录。');
    relaunch(routes.login);
    return;
  }
  await showError(error, fallback);
};
