const loginApiMocks = vi.hoisted(() => ({
  request: vi.fn()
}));

vi.mock('@/utils/request', () => ({
  default: loginApiMocks.request
}));

import { getCodeImg, getInfo, login, logout, register } from '@/api/login';

describe('api/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('sends login request with default clientId and grantType', () => {
    login({
      userName: 'alice',
      password: '123456',
      code: 'abcd',
      uuid: 'uuid-1'
    } as any);

    expect(loginApiMocks.request).toHaveBeenCalledWith({
      url: '/auth/login',
      headers: {
        isToken: false,
        isEncrypt: true,
        repeatSubmit: false
      },
      method: 'post',
      data: {
        userName: 'alice',
        password: '123456',
        code: 'abcd',
        uuid: 'uuid-1',
        clientId: 'test-client-id',
        grantType: 'password'
      }
    });
  });

  it('keeps explicit login clientId and grantType when provided', () => {
    login({
      userName: 'alice',
      password: '123456',
      code: 'abcd',
      uuid: 'uuid-1',
      clientId: 'custom-client',
      grantType: 'sms'
    } as any);

    expect(loginApiMocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: 'custom-client',
          grantType: 'sms'
        })
      })
    );
  });

  it('sends register request with fixed clientId and password grant type', () => {
    register({
      userName: 'new-user',
      password: '123456',
      clientId: 'override-client',
      grantType: 'sms'
    });

    expect(loginApiMocks.request).toHaveBeenCalledWith({
      url: '/auth/register',
      headers: {
        isToken: false,
        isEncrypt: true,
        repeatSubmit: false
      },
      method: 'post',
      data: {
        userName: 'new-user',
        password: '123456',
        clientId: 'test-client-id',
        grantType: 'password'
      }
    });
  });

  it('calls logout endpoint directly when sse flag is disabled', () => {
    vi.stubEnv('VITE_APP_SSE', 'false');

    logout();

    expect(loginApiMocks.request).toHaveBeenCalledTimes(1);
    expect(loginApiMocks.request).toHaveBeenCalledWith({
      url: '/auth/logout',
      method: 'post'
    });
  });

  it('closes sse stream before logout when sse flag is enabled', () => {
    vi.stubEnv('VITE_APP_SSE', 'true');

    logout();

    expect(loginApiMocks.request).toHaveBeenCalledTimes(2);
    expect(loginApiMocks.request).toHaveBeenNthCalledWith(1, {
      url: '/resource/sse/close',
      method: 'get'
    });
    expect(loginApiMocks.request).toHaveBeenNthCalledWith(2, {
      url: '/auth/logout',
      method: 'post'
    });
  });

  it('requests captcha and user info endpoints', () => {
    getCodeImg();
    getInfo();

    expect(loginApiMocks.request).toHaveBeenNthCalledWith(1, {
      url: '/auth/code',
      headers: {
        isToken: false
      },
      method: 'get',
      timeout: 20000
    });
    expect(loginApiMocks.request).toHaveBeenNthCalledWith(2, {
      url: '/system/user/getInfo',
      method: 'get'
    });
  });
});
