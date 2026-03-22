import { describe, expectTypeOf, it } from 'vitest';
import { login, getCodeImg, getInfo } from '@/api/login';
import { getRouters } from '@/api/menu';
import type { ApiResponse, LoginData, LoginResult, VerifyCodeResult } from '@/api/types';
import type { UserInfo } from '@/api/system/user/types';
import type { AppRoute } from '@/types/router';

describe('api/type-contract', () => {
  it('checks login API contracts', () => {
    expectTypeOf(login).parameter(0).toMatchTypeOf<LoginData>();
    expectTypeOf(login).returns.toMatchTypeOf<Promise<ApiResponse<LoginResult>>>();
  });

  it('checks verify code and user info contracts', () => {
    expectTypeOf(getCodeImg).returns.toMatchTypeOf<Promise<ApiResponse<VerifyCodeResult>>>();
    expectTypeOf(getInfo).returns.toMatchTypeOf<Promise<ApiResponse<UserInfo>>>();
  });

  it('checks router API contracts', () => {
    expectTypeOf(getRouters).returns.toMatchTypeOf<Promise<ApiResponse<AppRoute[]>>>();
  });
});
