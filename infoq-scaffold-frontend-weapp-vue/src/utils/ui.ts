import uni, { getCurrentPagesSafe } from '@/utils/uni';
import { isAuthError, toErrorMessage } from '@/api';
import { relaunch, routes } from './navigation';

export const showSuccess = (title: string) => uni.showToast({ title, icon: 'success' });

const showError = (error: unknown, fallback?: string) =>
  uni.showToast({
    title: toErrorMessage(error, fallback),
    icon: 'none',
    duration: 2200
  });

const normalizeRoute = (value: unknown) => {
  const route = typeof value === 'string' ? value.trim() : '';
  if (!route) {
    return '';
  }
  const normalized = route.startsWith('/') ? route : `/${route}`;
  const queryIndex = normalized.indexOf('?');
  return queryIndex >= 0 ? normalized.slice(0, queryIndex) : normalized;
};

const isLoginRouteActive = () => {
  const pages = getCurrentPagesSafe() as Array<{ route?: string }>;
  const current = pages[pages.length - 1];
  return normalizeRoute(current?.route) === routes.login;
};

export const handlePageError = async (error: unknown, fallback?: string) => {
  if (isAuthError(error)) {
    await showError(error, '登录状态已失效，请重新登录。');
    if (!isLoginRouteActive()) {
      relaunch(routes.login);
    }
    return;
  }
  await showError(error, fallback);
};
