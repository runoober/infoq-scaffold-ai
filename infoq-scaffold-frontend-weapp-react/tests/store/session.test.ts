import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('infoq-mobile-core', () => ({
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
    useSessionStore.setState({ token: '', user: null, permissions: [], initialized: false });

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
    mockGetToken.mockReturnValue('');

    const result = await useSessionStore.getState().loadSession();

    expect(result).toBeNull();
    expect(useSessionStore.getState().initialized).toBe(true);
    expect(useSessionStore.getState().token).toBe('');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('loadSession should reuse cached state when initialized and force=false', async () => {
    mockGetToken.mockReturnValue('cached-token');
    useSessionStore.setState({
      token: 'cached-token',
      user: { userId: 1, userName: 'cached-user' },
      permissions: ['system:user:list'],
      initialized: true
    });

    const result = await useSessionStore.getState().loadSession();

    expect(mockGetInfo).not.toHaveBeenCalled();
    expect(result?.user.userName).toBe('cached-user');
    expect(result?.permissions).toEqual(['system:user:list']);
  });

  it('signIn should persist token and user info', async () => {
    mockLogin.mockResolvedValue({ data: { access_token: 'token-1' } });
    mockGetInfo.mockResolvedValue({
      data: {
        user: { userId: 100, userName: 'tester' },
        roles: [],
        permissions: ['*:*:*']
      }
    });
    mockNormalizePermissions.mockReturnValue(['system:user:list', 'monitor:online:list']);

    await useSessionStore.getState().signIn({ username: 'tester', password: 'pwd' });

    expect(mockSetToken).toHaveBeenCalledWith('token-1');
    expect(useSessionStore.getState().token).toBe('token-1');
    expect(useSessionStore.getState().user?.userName).toBe('tester');
    expect(useSessionStore.getState().permissions).toEqual(['system:user:list', 'monitor:online:list']);
    expect(useSessionStore.getState().initialized).toBe(true);
  });

  it('signOut should clear state even when remote logout fails', async () => {
    mockGetToken.mockReturnValue('token-2');
    mockLogout.mockRejectedValue(new Error('logout failed'));
    useSessionStore.setState({
      token: 'token-2',
      user: { userId: 2, userName: 'u2' },
      permissions: ['system:user:list'],
      initialized: true
    });

    await expect(useSessionStore.getState().signOut()).rejects.toThrow('logout failed');

    expect(mockRemoveToken).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().token).toBe('');
    expect(useSessionStore.getState().user).toBeNull();
    expect(useSessionStore.getState().permissions).toEqual([]);
    expect(useSessionStore.getState().initialized).toBe(true);
  });

  it('hasPermission should delegate to mobile-core permission helper', () => {
    useSessionStore.setState({ permissions: ['system:dept:list'] });
    mockHasPermission.mockReturnValue(true);

    const result = useSessionStore.getState().hasPermission('system:dept:list');

    expect(result).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith(['system:dept:list'], 'system:dept:list');
  });
});
