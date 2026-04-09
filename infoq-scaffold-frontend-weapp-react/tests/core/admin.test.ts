import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockListLoginInfo,
  mockListOnlineUsers,
  mockListRole,
  mockListUser
} = vi.hoisted(() => ({
  mockListLoginInfo: vi.fn(),
  mockListOnlineUsers: vi.fn(),
  mockListRole: vi.fn(),
  mockListUser: vi.fn()
}));

vi.mock('../../src/api/monitor/loginInfo', () => ({
  listLoginInfo: mockListLoginInfo
}));

vi.mock('../../src/api/monitor/online', () => ({
  listOnlineUsers: mockListOnlineUsers
}));

vi.mock('../../src/api/system/role', () => ({
  listRole: mockListRole
}));

vi.mock('../../src/api/system/user', () => ({
  listUser: mockListUser
}));

import { loadWorkbenchSummary, mobileAdminModules } from '../../src/api/admin';

describe('admin', () => {
  beforeEach(() => {
    mockListUser.mockReset();
    mockListRole.mockReset();
    mockListOnlineUsers.mockReset();
    mockListLoginInfo.mockReset();
  });

  it('mobileAdminModules should expose all expected module keys', () => {
    expect(mobileAdminModules).toHaveLength(11);
    expect(mobileAdminModules.map((item) => item.key)).toEqual([
      'users',
      'roles',
      'depts',
      'posts',
      'menus',
      'notices',
      'dicts',
      'loginInfo',
      'operLog',
      'online',
      'cache'
    ]);
  });

  it('loadWorkbenchSummary should return zero totals when no permission is granted', async () => {
    const summary = await loadWorkbenchSummary([]);

    expect(summary).toEqual({
      userTotal: 0,
      roleTotal: 0,
      onlineTotal: 0,
      loginTotal: 0
    });

    expect(mockListUser).not.toHaveBeenCalled();
    expect(mockListRole).not.toHaveBeenCalled();
    expect(mockListOnlineUsers).not.toHaveBeenCalled();
    expect(mockListLoginInfo).not.toHaveBeenCalled();
  });

  it('loadWorkbenchSummary should request allowed modules and resolve totals', async () => {
    mockListUser.mockResolvedValue({ total: 21, rows: [] });
    mockListRole.mockResolvedValue({ rows: [1, 2] });
    mockListOnlineUsers.mockResolvedValue({ total: 3, rows: [] });
    mockListLoginInfo.mockResolvedValue({ rows: [1] });

    const summary = await loadWorkbenchSummary([
      'system:user:list',
      'system:role:list',
      'monitor:online:list',
      'monitor:loginInfo:list'
    ]);

    expect(summary).toEqual({
      userTotal: 21,
      roleTotal: 2,
      onlineTotal: 3,
      loginTotal: 1
    });

    expect(mockListUser).toHaveBeenCalledTimes(1);
    expect(mockListRole).toHaveBeenCalledTimes(1);
    expect(mockListOnlineUsers).toHaveBeenCalledTimes(1);
    expect(mockListLoginInfo).toHaveBeenCalledTimes(1);
  });
});
