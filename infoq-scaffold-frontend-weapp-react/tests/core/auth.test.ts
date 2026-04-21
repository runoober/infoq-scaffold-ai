import { beforeEach, describe, expect, it } from 'vitest';
import Taro from '@tarojs/taro';
import {
  getRememberedLogin,
  getToken,
  removeToken,
  setRememberedLogin,
  setToken
} from '../../src/utils/auth';

const setStorageSync = Taro.setStorageSync as unknown as (key: string, value: unknown) => void;

describe('auth', () => {
  beforeEach(() => {
    removeToken();
    setRememberedLogin({ username: '', password: '', rememberMe: false });
  });

  it('token helpers should read/write storage', () => {
    expect(getToken()).toBe('');
    setToken('token-1');
    expect(getToken()).toBe('token-1');
    removeToken();
    expect(getToken()).toBe('');
  });

  it('getRememberedLogin should return explicit remembered credential object', () => {
    setRememberedLogin({ username: 'admin', password: 'secret', rememberMe: true });

    expect(getRememberedLogin()).toEqual({
      username: 'admin',
      password: 'secret',
      rememberMe: true
    });
  });

  it('getRememberedLogin should normalize missing fields in remembered payload', () => {
    setStorageSync('Mobile-Remembered-Login', { rememberMe: true });

    expect(getRememberedLogin()).toEqual({
      username: '',
      password: '',
      rememberMe: true
    });
  });

  it('getRememberedLogin should fallback to last username when remembered payload missing', () => {
    setStorageSync('Mobile-Remembered-Login', 'invalid-payload');
    setStorageSync('Mobile-Last-Username', 'last-user');

    expect(getRememberedLogin()).toEqual({
      username: 'last-user',
      password: '',
      rememberMe: false
    });
  });

  it('setRememberedLogin should clear both remembered and last username when rememberMe=false', () => {
    setRememberedLogin({ username: 'u2', password: 'p2', rememberMe: true });
    expect(getRememberedLogin().username).toBe('u2');

    setRememberedLogin({ username: 'u2', password: 'p2', rememberMe: false });
    expect(getRememberedLogin()).toEqual({
      username: '',
      password: '',
      rememberMe: false
    });
  });
});
