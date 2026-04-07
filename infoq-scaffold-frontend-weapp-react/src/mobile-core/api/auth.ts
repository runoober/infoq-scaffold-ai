import { mobileEnv } from '../env';
import { request } from '../request';
import type { ApiResponse, LoginData, LoginResult, UserInfo, VerifyCodeResult } from '../types';

export const login = (data: LoginData) =>
  request<ApiResponse<LoginResult>, LoginData>({
    url: '/auth/login',
    method: 'POST',
    headers: {
      isToken: false,
      isEncrypt: true,
      repeatSubmit: false
    },
    data: {
      ...data,
      clientId: data.clientId || mobileEnv.clientId,
      grantType: data.grantType || 'password'
    }
  });

export const logout = () =>
  request<ApiResponse<null>>({
    url: '/auth/logout',
    method: 'POST'
  });

export const getCodeImg = () =>
  request<ApiResponse<VerifyCodeResult>>({
    url: '/auth/code',
    method: 'GET',
    headers: {
      isToken: false
    },
    timeout: 20000
  });

export const getInfo = () =>
  request<ApiResponse<UserInfo>>({
    url: '/system/user/getInfo',
    method: 'GET'
  });
