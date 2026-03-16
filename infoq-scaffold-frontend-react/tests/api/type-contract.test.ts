import { describe, expectTypeOf, it } from 'vitest';
import type { AxiosPromise } from 'axios';
import { login, getCodeImg, getInfo } from '@/api/login';
import { getRouters } from '@/api/menu';
import type { LoginData, LoginResult, VerifyCodeResult } from '@/api/types';
import type { UserInfo } from '@/api/system/user/types';
import type { AppRoute } from '@/types/router';

describe('api/type-contract', () => {
  it('checks login API contracts', () => {
    expectTypeOf(login).parameter(0).toMatchTypeOf<LoginData>();
    expectTypeOf(login).returns.toMatchTypeOf<AxiosPromise<LoginResult>>();
  });

  it('checks verify code and user info contracts', () => {
    expectTypeOf(getCodeImg).returns.toMatchTypeOf<AxiosPromise<VerifyCodeResult>>();
    expectTypeOf(getInfo).returns.toMatchTypeOf<AxiosPromise<UserInfo>>();
  });

  it('checks router API contracts', () => {
    expectTypeOf(getRouters).returns.toMatchTypeOf<AxiosPromise<AppRoute[]>>();
  });
});
