import uni from '@/utils/uni';

const TOKEN_KEY = 'Admin-Token';
const LAST_USERNAME_KEY = 'Mobile-Last-Username';
const REMEMBERED_LOGIN_KEY = 'Mobile-Remembered-Login';

type RememberedLogin = {
  username: string;
  password: string;
  rememberMe: boolean;
};

export const getToken = () => String(uni.getStorageSync(TOKEN_KEY) || '');

export const setToken = (token: string) => {
  uni.setStorageSync(TOKEN_KEY, token);
};

export const removeToken = () => {
  uni.removeStorageSync(TOKEN_KEY);
};

export const getRememberedLogin = (): RememberedLogin => {
  const stored = uni.getStorageSync(REMEMBERED_LOGIN_KEY);
  if (stored && typeof stored === 'object') {
    const remembered = stored as Partial<RememberedLogin>;
    return {
      username: String(remembered.username || ''),
      password: String(remembered.password || ''),
      rememberMe: remembered.rememberMe === true
    };
  }
  return {
    username: String(uni.getStorageSync(LAST_USERNAME_KEY) || ''),
    password: '',
    rememberMe: false
  };
};

export const setRememberedLogin = (value: RememberedLogin) => {
  if (!value.rememberMe) {
    uni.removeStorageSync(REMEMBERED_LOGIN_KEY);
    uni.removeStorageSync(LAST_USERNAME_KEY);
    return;
  }
  uni.setStorageSync(REMEMBERED_LOGIN_KEY, value);
  uni.setStorageSync(LAST_USERNAME_KEY, value.username);
};
