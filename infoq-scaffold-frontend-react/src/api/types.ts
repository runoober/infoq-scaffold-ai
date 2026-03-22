export interface ApiResult {
  code?: number;
  msg?: string;
}

export interface ApiResponse<T> extends ApiResult {
  data: T;
}

export interface TableResponse<T> extends ApiResult {
  rows: T[];
  total?: number;
}

/**
 * 注册
 */
export type RegisterForm = {
  username: string;
  password: string;
  confirmPassword?: string;
  code?: string;
  uuid?: string;
  userType?: string;
};

/**
 * 登录请求
 */
export interface LoginData {
  username?: string;
  password?: string;
  rememberMe?: boolean;
  source?: string;
  code?: string;
  uuid?: string;
  clientId: string;
  grantType: string;
}

/**
 * 登录响应
 */
export interface LoginResult {
  access_token: string;
}

/**
 * 验证码返回
 */
export interface VerifyCodeResult {
  captchaEnabled: boolean;
  uuid?: string;
  img?: string;
}
