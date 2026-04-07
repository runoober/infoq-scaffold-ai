import Taro from '@tarojs/taro';

const TOKEN_KEY = 'Admin-Token';
const LAST_USERNAME_KEY = 'Mobile-Last-Username';
const REMEMBERED_LOGIN_KEY = 'Mobile-Remembered-Login';

type RememberedLogin = {
  username: string;
  password: string;
  rememberMe: boolean;
};

export const getToken = () => String(Taro.getStorageSync(TOKEN_KEY) || '');

export const setToken = (token: string) => {
  Taro.setStorageSync(TOKEN_KEY, token);
};

export const removeToken = () => {
  Taro.removeStorageSync(TOKEN_KEY);
};

export const getRememberedLogin = (): RememberedLogin => {
  const stored = Taro.getStorageSync(REMEMBERED_LOGIN_KEY);
  if (stored && typeof stored === 'object') {
    const remembered = stored as Partial<RememberedLogin>;
    return {
      username: String(remembered.username || ''),
      password: String(remembered.password || ''),
      rememberMe: remembered.rememberMe === true
    };
  }
  return {
    username: String(Taro.getStorageSync(LAST_USERNAME_KEY) || ''),
    password: '',
    rememberMe: false
  };
};

export const setRememberedLogin = (value: RememberedLogin) => {
  if (!value.rememberMe) {
    Taro.removeStorageSync(REMEMBERED_LOGIN_KEY);
    Taro.removeStorageSync(LAST_USERNAME_KEY);
    return;
  }
  Taro.setStorageSync(REMEMBERED_LOGIN_KEY, value);
  Taro.setStorageSync(LAST_USERNAME_KEY, value.username);
};

export const getLastUsername = () => String(Taro.getStorageSync(LAST_USERNAME_KEY) || '');

export const setLastUsername = (username: string) => {
  if (!username) {
    Taro.removeStorageSync(LAST_USERNAME_KEY);
    return;
  }
  Taro.setStorageSync(LAST_USERNAME_KEY, username);
};
