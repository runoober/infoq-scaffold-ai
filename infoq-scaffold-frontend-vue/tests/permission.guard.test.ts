import { ElMessage } from 'element-plus/es';

type GuardSetupOptions = {
  token?: string;
  roles?: string[];
  getInfoReject?: boolean;
  accessRoutes?: any[];
};

const createToRoute = (path: string, fullPath?: string, title?: string) => {
  return {
    path,
    fullPath: fullPath ?? path,
    meta: title ? { title } : {},
    params: { id: '1' },
    query: { q: '1' },
    hash: '#h',
    name: 'TargetRoute'
  } as any;
};

const loadPermissionGuard = async (options: GuardSetupOptions = {}) => {
  vi.resetModules();

  const nprogress = {
    configure: vi.fn(),
    start: vi.fn(),
    done: vi.fn()
  };
  const routerMock = {
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    addRoute: vi.fn(),
    currentRoute: {
      value: {
        fullPath: '/current/full/path'
      }
    }
  };
  const userStore = {
    roles: options.roles ?? [],
    getInfo: vi.fn(),
    logout: vi.fn(() => Promise.resolve())
  };
  const settingsStore = {
    setTitle: vi.fn()
  };
  const permissionStore = {
    generateRoutes: vi.fn()
  };
  const isRelogin = { show: false };

  if (options.getInfoReject) {
    userStore.getInfo.mockRejectedValue(new Error('get-info-failed'));
  } else {
    userStore.getInfo.mockResolvedValue(undefined);
  }
  permissionStore.generateRoutes.mockResolvedValue(
    options.accessRoutes ?? [
      { path: '/system/user', name: 'SysUser' },
      { path: 'https://docs.example.com', name: 'DocLink' }
    ]
  );

  vi.doMock('nprogress', () => ({
    default: nprogress,
    configure: nprogress.configure,
    start: nprogress.start,
    done: nprogress.done
  }));
  vi.doMock('@/router', () => ({
    default: routerMock
  }));
  vi.doMock('@/utils/auth', () => ({
    getToken: vi.fn(() => options.token ?? '')
  }));
  vi.doMock('@/utils/request', () => ({
    isRelogin
  }));
  vi.doMock('@/store/modules/user', () => ({
    useUserStore: vi.fn(() => userStore)
  }));
  vi.doMock('@/store/modules/settings', () => ({
    useSettingsStore: vi.fn(() => settingsStore)
  }));
  vi.doMock('@/store/modules/permission', () => ({
    usePermissionStore: vi.fn(() => permissionStore)
  }));

  await import('@/permission');

  const beforeHook = routerMock.beforeEach.mock.calls[0]?.[0];
  const afterHook = routerMock.afterEach.mock.calls[0]?.[0];

  return {
    beforeHook,
    afterHook,
    nprogress,
    routerMock,
    userStore,
    settingsStore,
    permissionStore,
    isRelogin
  };
};

describe('permission route guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login with encoded redirect when token is missing', async () => {
    const ctx = await loadPermissionGuard();
    const next = vi.fn();
    await ctx.beforeHook(createToRoute('/system/user', '/system/user?page=1'), {} as any, next);

    expect(next).toHaveBeenCalledWith('/login?redirect=%2Fsystem%2Fuser%3Fpage%3D1');
    expect(ctx.nprogress.start).toHaveBeenCalled();
    expect(ctx.nprogress.done).toHaveBeenCalled();
  });

  it('allows whitelist route when token is missing', async () => {
    const ctx = await loadPermissionGuard();
    const next = vi.fn();
    await ctx.beforeHook(createToRoute('/register/sub-page'), {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('redirects authenticated user away from login page', async () => {
    const ctx = await loadPermissionGuard({ token: 'token-a', roles: ['admin'] });
    const next = vi.fn();
    await ctx.beforeHook(createToRoute('/login'), {} as any, next);

    expect(next).toHaveBeenCalledWith({ path: '/' });
    expect(ctx.nprogress.done).toHaveBeenCalled();
  });

  it('allows whitelist route directly when token exists', async () => {
    const ctx = await loadPermissionGuard({ token: 'token-a', roles: ['admin'] });
    const next = vi.fn();
    await ctx.beforeHook(createToRoute('/register'), {} as any, next);

    expect(next).toHaveBeenCalledWith();
    expect(ctx.userStore.getInfo).not.toHaveBeenCalled();
  });

  it('continues navigation directly when roles already exist', async () => {
    const ctx = await loadPermissionGuard({ token: 'token-a', roles: ['admin'] });
    const next = vi.fn();
    await ctx.beforeHook(createToRoute('/system/user', '/system/user', '用户管理'), {} as any, next);

    expect(ctx.settingsStore.setTitle).toHaveBeenCalledWith('用户管理');
    expect(ctx.userStore.getInfo).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('loads user info and dynamic routes when authenticated roles are empty', async () => {
    const ctx = await loadPermissionGuard({ token: 'token-a', roles: [] });
    const next = vi.fn();
    const to = createToRoute('/system/menu', '/system/menu?type=1', '菜单管理');

    await ctx.beforeHook(to, {} as any, next);

    expect(ctx.userStore.getInfo).toHaveBeenCalled();
    expect(ctx.permissionStore.generateRoutes).toHaveBeenCalled();
    expect(ctx.routerMock.addRoute).toHaveBeenCalledTimes(1);
    expect(ctx.routerMock.addRoute).toHaveBeenCalledWith(expect.objectContaining({ path: '/system/user' }));
    expect(ctx.isRelogin.show).toBe(false);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/system/menu',
        replace: true,
        params: to.params,
        query: to.query,
        hash: to.hash
      })
    );
  });

  it('handles getInfo failure by logout and fallback navigation', async () => {
    const ctx = await loadPermissionGuard({ token: 'token-a', roles: [], getInfoReject: true });
    const next = vi.fn();
    await ctx.beforeHook(createToRoute('/system/dept'), {} as any, next);

    expect(ctx.userStore.logout).toHaveBeenCalled();
    expect((ElMessage as any).error).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith({ path: '/' });
    expect(ctx.isRelogin.show).toBe(false);
  });

  it('stops progress bar on afterEach hook', async () => {
    const ctx = await loadPermissionGuard({ token: 'token-a', roles: ['admin'] });
    ctx.afterHook();
    expect(ctx.nprogress.done).toHaveBeenCalled();
  });
});
