import { describe, expect, it, vi } from 'vitest';

type SetupOptions = {
  authError?: boolean;
  route?: string;
  message?: string;
};

const setupUiModule = async (options: SetupOptions = {}) => {
  vi.resetModules();

  const authError = options.authError ?? false;
  const route = options.route ?? 'pages/home/index';
  const message = options.message ?? 'fallback-message';

  const isAuthErrorMock = vi.fn(() => authError);
  const toErrorMessageMock = vi.fn(() => message);

  vi.doMock('../../src/api', () => ({
    isAuthError: isAuthErrorMock,
    toErrorMessage: toErrorMessageMock
  }));

  const currentPagesMock = globalThis.getCurrentPages as unknown as ReturnType<typeof vi.fn>;
  currentPagesMock.mockReturnValue(route ? [{ route }] : []);

  const uiModule = await import('../../src/utils/ui');

  return {
    handlePageError: uiModule.handlePageError,
    mocks: {
      uni: globalThis.uni as unknown as {
        reLaunch: ReturnType<typeof vi.fn>;
        showToast: ReturnType<typeof vi.fn>;
      },
      isAuthErrorMock,
      toErrorMessageMock
    }
  };
};

describe('ui', () => {
  it('should relaunch to login for auth errors when current route is protected', async () => {
    const { handlePageError, mocks } = await setupUiModule({
      authError: true,
      route: 'pages/home/index',
      message: 'auth-error'
    });

    await handlePageError(new Error('boom'), 'fallback');

    expect(mocks.uni.showToast).toHaveBeenCalled();
    expect(mocks.uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/login/index' });
  });

  it('should not relaunch when auth error happens on login route', async () => {
    const { handlePageError, mocks } = await setupUiModule({
      authError: true,
      route: 'pages/login/index',
      message: 'auth-error'
    });

    await handlePageError(new Error('boom'), 'fallback');

    expect(mocks.uni.showToast).toHaveBeenCalled();
    expect(mocks.uni.reLaunch).not.toHaveBeenCalled();
  });
});
