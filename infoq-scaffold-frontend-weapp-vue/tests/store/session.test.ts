import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const {
  mockGetInfo,
  mockGetToken,
  mockHasPermission,
  mockLogin,
  mockNormalizePermissions,
  mockLogout,
  mockRemoveToken,
  mockSetToken
} = vi.hoisted(() => ({
  mockGetInfo: vi.fn(),
  mockGetToken: vi.fn(),
  mockHasPermission: vi.fn(),
  mockLogin: vi.fn(),
  mockNormalizePermissions: vi.fn(),
  mockLogout: vi.fn(),
  mockRemoveToken: vi.fn(),
  mockSetToken: vi.fn()
}));

vi.mock('@/api', () => ({
  getInfo: mockGetInfo,
  getToken: mockGetToken,
  hasPermission: mockHasPermission,
  login: mockLogin,
  normalizePermissions: mockNormalizePermissions,
  logout: mockLogout,
  removeToken: mockRemoveToken,
  setToken: mockSetToken
}));

import { useSessionStore } from '../../src/store/session';

describe('store/session', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    mockGetInfo.mockReset();
    mockGetToken.mockReset();
    mockHasPermission.mockReset();
    mockLogin.mockReset();
    mockNormalizePermissions.mockReset();
    mockLogout.mockReset();
    mockRemoveToken.mockReset();
    mockSetToken.mockReset();

    mockNormalizePermissions.mockImplementation((permissions: string[]) => permissions);
    mockHasPermission.mockImplementation((permissions: string[], permission: string) => permissions.includes(permission));
  });

  it('loadSession should clear state when token is missing', async () => {
    const store = useSessionStore();
    mockGetToken.mockReturnValue('');

    const result = await store.loadSession();

    expect(result).toBeNull();
    expect(store.initialized).toBe(true);
    expect(store.token).toBe('');
    expect(store.user).toBeNull();
  });

  it('loadSession should reuse cached state when initialized and force=false', async () => {
    const store = useSessionStore();
    mockGetToken.mockReturnValue('cached-token');
    store.$patch({
      token: 'cached-token',
      user: { userId: 1, userName: 'cached-user' } as any,
      permissions: ['system:user:list'],
      initialized: true
    });

    const result = await store.loadSession();

    expect(mockGetInfo).not.toHaveBeenCalled();
    expect(result?.user.userName).toBe('cached-user');
    expect(result?.permissions).toEqual(['system:user:list']);
  });

  it('signIn should persist token and user info', async () => {
    const store = useSessionStore();
    mockLogin.mockResolvedValue({ data: { access_token: 'token-1' } });
    mockGetInfo.mockResolvedValue({
      data: {
        user: { userId: 100, userName: 'tester' },
        roles: [],
        permissions: ['*:*:*']
      }
    });
    mockNormalizePermissions.mockReturnValue(['system:user:list', 'monitor:online:list']);

    await store.signIn({ username: 'tester', password: 'pwd' });

    expect(mockSetToken).toHaveBeenCalledWith('token-1');
    expect(store.token).toBe('token-1');
    expect(store.user?.userName).toBe('tester');
    expect(store.permissions).toEqual(['system:user:list', 'monitor:online:list']);
    expect(store.initialized).toBe(true);
  });

  it('signIn should fallback to empty permissions when backend omits permissions', async () => {
    const store = useSessionStore();
    mockLogin.mockResolvedValue({ data: { access_token: 'token-4' } });
    mockGetInfo.mockResolvedValue({
      data: {
        user: { userId: 101, userName: 'tester2' },
        roles: [],
        permissions: undefined
      }
    });
    mockNormalizePermissions.mockReturnValue([]);

    await store.signIn({ username: 'tester2', password: 'pwd2' });

    expect(mockNormalizePermissions).toHaveBeenCalledWith([]);
    expect(store.permissions).toEqual([]);
  });

  it('signOut should clear state even when remote logout fails', async () => {
    const store = useSessionStore();
    mockGetToken.mockReturnValue('token-2');
    mockLogout.mockRejectedValue(new Error('logout failed'));
    store.$patch({
      token: 'token-2',
      user: { userId: 2, userName: 'u2' } as any,
      permissions: ['system:user:list'],
      initialized: true
    });

    await expect(store.signOut()).rejects.toThrow('logout failed');

    expect(mockRemoveToken).toHaveBeenCalledTimes(1);
    expect(store.token).toBe('');
    expect(store.user).toBeNull();
    expect(store.permissions).toEqual([]);
    expect(store.initialized).toBe(true);
  });

  it('signOut should call remote logout when token exists and clear state', async () => {
    const store = useSessionStore();
    mockGetToken.mockReturnValue('token-3');
    mockLogout.mockResolvedValue(undefined);
    store.$patch({
      token: 'token-3',
      user: { userId: 3, userName: 'u3' } as any,
      permissions: ['system:user:list'],
      initialized: true
    });

    await store.signOut();

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockRemoveToken).toHaveBeenCalledTimes(1);
    expect(store.token).toBe('');
    expect(store.user).toBeNull();
  });

  it('loadSession(force=true) should refresh user info even when initialized', async () => {
    const store = useSessionStore();
    mockGetToken.mockReturnValue('force-token');
    mockGetInfo.mockResolvedValue({
      data: {
        user: { userId: 300, userName: 'forced' },
        roles: [],
        permissions: ['system:dept:list']
      }
    });
    store.$patch({
      token: 'force-token',
      user: { userId: 200, userName: 'cached' } as any,
      permissions: ['system:user:list'],
      initialized: true
    });

    const result = await store.loadSession(true);

    expect(mockGetInfo).toHaveBeenCalledTimes(1);
    expect(result?.user.userName).toBe('forced');
    expect(store.user?.userName).toBe('forced');
  });

  it('signOut should skip remote logout when token is missing', async () => {
    const store = useSessionStore();
    mockGetToken.mockReturnValue('');
    store.$patch({
      token: '',
      user: { userId: 10, userName: 'u10' } as any,
      permissions: ['system:user:list'],
      initialized: true
    });

    await store.signOut();

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockRemoveToken).toHaveBeenCalledTimes(1);
    expect(store.user).toBeNull();
  });

  it('patchUser should merge when user exists and initialize when user is null', () => {
    const store = useSessionStore();

    store.$patch({
      user: { userId: 501, userName: 'origin', nickName: 'n1' } as any
    });
    store.patchUser({
      nickName: 'n2'
    } as any);
    expect(store.user).toMatchObject({
      userId: 501,
      userName: 'origin',
      nickName: 'n2'
    });

    store.$patch({
      user: null
    });
    store.patchUser({
      userName: 'new-user'
    } as any);
    expect(store.user).toMatchObject({
      userName: 'new-user'
    });
  });

  it('hasPermission should delegate to permission helper', () => {
    const store = useSessionStore();
    store.$patch({ permissions: ['system:dept:list'] });
    mockHasPermission.mockReturnValue(true);

    const result = store.hasPermission('system:dept:list');

    expect(result).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith(['system:dept:list'], 'system:dept:list');
  });
});
