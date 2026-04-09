import { describe, expect, it } from 'vitest';
import { AppError, AuthError, isAuthError, toErrorMessage } from '../../src/utils/errors';

describe('errors', () => {
  it('AppError should preserve message kind and code', () => {
    const error = new AppError('api-error', 'api', 500);
    expect(error.name).toBe('AppError');
    expect(error.kind).toBe('api');
    expect(error.code).toBe(500);
    expect(error.message).toBe('api-error');
  });

  it('AuthError should provide auth defaults', () => {
    const error = new AuthError();
    expect(error.name).toBe('AuthError');
    expect(error.kind).toBe('auth');
    expect(error.code).toBe(401);
  });

  it('isAuthError should detect both AuthError and auth-kind AppError', () => {
    expect(isAuthError(new AuthError('expired'))).toBe(true);
    expect(isAuthError(new AppError('auth-like', 'auth', 401))).toBe(true);
    expect(isAuthError(new AppError('api-like', 'api', 500))).toBe(false);
    expect(isAuthError('plain')).toBe(false);
  });

  it('toErrorMessage should normalize different payloads', () => {
    expect(toErrorMessage(new Error('x'))).toBe('x');
    expect(toErrorMessage('str')).toBe('str');
    expect(toErrorMessage(undefined, 'fallback')).toBe('fallback');
  });
});
