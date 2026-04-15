import { useSessionStore } from '@/store/session';
import { routes } from '@/utils/navigation';

export const ensureAuthenticated = () => {
  const sessionStore = useSessionStore();
  if (sessionStore.token || sessionStore.user) {
    return true;
  }
  const token = uni.getStorageSync('Admin-Token');
  if (token) {
    return true;
  }
  uni.reLaunch({ url: routes.login });
  return false;
};
