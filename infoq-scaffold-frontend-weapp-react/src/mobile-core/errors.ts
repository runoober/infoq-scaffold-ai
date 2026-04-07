export type AppErrorKind = 'api' | 'auth' | 'network' | 'config';

export class AppError extends Error {
  code?: number;
  kind: AppErrorKind;

  constructor(message: string, kind: AppErrorKind, code?: number) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.code = code;
  }
}

export class AuthError extends AppError {
  constructor(message = '登录状态已失效，请重新登录。', code = 401) {
    super(message, 'auth', code);
    this.name = 'AuthError';
  }
}

export const errorCode: Record<string, string> = {
  '401': '认证失败，无法访问系统资源',
  '403': '当前操作没有权限',
  '404': '访问资源不存在',
  default: '系统未知错误，请反馈给管理员'
};

export const isAuthError = (error: unknown): error is AuthError =>
  error instanceof AuthError || (error instanceof AppError && error.kind === 'auth');

export const toErrorMessage = (error: unknown, fallback = '请求失败，请稍后重试。') => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error) {
    return error;
  }
  return fallback;
};
