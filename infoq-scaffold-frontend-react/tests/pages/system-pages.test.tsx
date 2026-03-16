import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../helpers/renderWithRouter';

const dictOptions = vi.hoisted(() => ({
  sys_normal_disable: [
    { label: '正常', value: '0' },
    { label: '停用', value: '1' }
  ],
  sys_user_sex: [
    { label: '男', value: '0' },
    { label: '女', value: '1' }
  ],
  sys_show_hide: [
    { label: '显示', value: '0' },
    { label: '隐藏', value: '1' }
  ]
}));

vi.mock('@/hooks/useDictOptions', () => ({
  default: (...types: string[]) => Object.fromEntries(types.map((type) => [type, dictOptions[type as keyof typeof dictOptions] || []]))
}));

vi.mock('@/components/Pagination', () => ({
  default: () => <div data-testid="pagination" />
}));

vi.mock('@/components/RightToolbar', () => ({
  default: () => <div data-testid="right-toolbar" />
}));

vi.mock('@/components/DictTag', () => ({
  default: ({
    options = [],
    value
  }: {
    options?: Array<{ label: string; value: string | number }>;
    value?: string | number | Array<string | number>;
  }) => {
    const values = Array.isArray(value) ? value.map(String) : value !== undefined ? [String(value)] : [];
    const text = values.map((item) => options.find((option) => String(option.value) === item)?.label || item).join(',');
    return <span>{text}</span>;
  }
}));

vi.mock('@/utils/modal', () => ({
  default: {
    confirm: vi.fn().mockResolvedValue(true),
    msgSuccess: vi.fn(),
    msgWarning: vi.fn(),
    msgError: vi.fn(),
    loading: vi.fn(),
    closeLoading: vi.fn()
  }
}));

vi.mock('@/api/system/user', () => ({
  listUser: vi.fn().mockResolvedValue({
    rows: [
      {
        userId: 1,
        userName: 'admin',
        nickName: '管理员',
        deptName: '研发部',
        phonenumber: '13800000000',
        status: '0',
        createTime: '2026-03-10 10:00:00'
      }
    ],
    total: 1
  }),
  deptTreeSelect: vi.fn().mockResolvedValue({
    data: [{ id: 100, label: '研发部', children: [] }]
  }),
  listUserByDeptId: vi.fn().mockResolvedValue({
    data: [{ userId: 1, userName: 'admin' }]
  }),
  addUser: vi.fn(),
  changeUserStatus: vi.fn(),
  delUser: vi.fn(),
  getUser: vi.fn(),
  resetUserPwd: vi.fn(),
  updateUser: vi.fn()
}));

vi.mock('@/api/system/role', () => ({
  listRole: vi.fn().mockResolvedValue({
    rows: [
      {
        roleId: 1,
        roleName: '管理员',
        roleKey: 'admin',
        roleSort: 1,
        status: '0',
        createTime: '2026-03-10 10:00:00'
      }
    ],
    total: 1
  }),
  deptTreeSelect: vi.fn().mockResolvedValue({
    data: { depts: [{ id: 100, label: '研发部', children: [] }], checkedKeys: [100] }
  }),
  addRole: vi.fn(),
  changeRoleStatus: vi.fn(),
  dataScope: vi.fn(),
  delRole: vi.fn(),
  getRole: vi.fn(),
  updateRole: vi.fn(),
  allocatedUserList: vi.fn(),
  authUserCancel: vi.fn(),
  authUserCancelAll: vi.fn()
}));

vi.mock('@/api/system/menu', () => ({
  listMenu: vi.fn().mockResolvedValue({
    data: [{ menuId: 1, parentId: 0, menuName: '系统管理', orderNum: 1, status: '0', createTime: '2026-03-10 10:00:00' }]
  }),
  roleMenuTreeselect: vi.fn().mockResolvedValue({
    data: { menus: [{ id: 1, label: '系统管理', children: [] }], checkedKeys: [1] }
  }),
  treeselect: vi.fn().mockResolvedValue({
    data: [{ id: 1, label: '系统管理', children: [] }]
  }),
  addMenu: vi.fn(),
  cascadeDelMenu: vi.fn(),
  delMenu: vi.fn(),
  getMenu: vi.fn(),
  updateMenu: vi.fn()
}));

vi.mock('@/api/system/dept', () => ({
  listDept: vi.fn().mockResolvedValue({
    data: [{ deptId: 100, parentId: 0, deptName: '研发部', deptCategory: 'RD', orderNum: 1, status: '0', createTime: '2026-03-10 10:00:00' }]
  }),
  listDeptExcludeChild: vi.fn().mockResolvedValue({ data: [] }),
  addDept: vi.fn(),
  delDept: vi.fn(),
  getDept: vi.fn(),
  updateDept: vi.fn()
}));

vi.mock('@/api/system/post', () => ({
  listPost: vi.fn().mockResolvedValue({
    rows: [{ postId: 10, postCode: 'RD-01', postCategory: 'TECH', postName: '研发岗', deptName: '研发部', postSort: 1, status: '0' }],
    total: 1
  }),
  deptTreeSelect: vi.fn().mockResolvedValue({
    data: [{ id: 100, label: '研发部', children: [] }]
  }),
  optionselect: vi.fn().mockResolvedValue({
    data: [{ postId: 10, postName: '研发岗' }]
  }),
  addPost: vi.fn(),
  delPost: vi.fn(),
  getPost: vi.fn(),
  updatePost: vi.fn()
}));

const { default: UserPage } = await import('@/pages/system/user/index');
const { default: RolePage } = await import('@/pages/system/role/index');
const { default: MenuPage } = await import('@/pages/system/menu/index');
const { default: DeptPage } = await import('@/pages/system/dept/index');
const { default: PostPage } = await import('@/pages/system/post/index');
const userApi = await import('@/api/system/user');
const roleApi = await import('@/api/system/role');
const menuApi = await import('@/api/system/menu');
const deptApi = await import('@/api/system/dept');
const postApi = await import('@/api/system/post');

describe('pages/system', () => {
  it('renders the user management page with fetched rows', async () => {
    renderWithRouter(<UserPage />, '/system/user');

    expect(await screen.findByText('用户管理')).toBeInTheDocument();
    await waitFor(() => {
      expect(userApi.listUser).toHaveBeenCalled();
      expect(userApi.deptTreeSelect).toHaveBeenCalled();
      expect(roleApi.listRole).toHaveBeenCalled();
      expect(postApi.optionselect).toHaveBeenCalled();
    });
  });

  it('renders the role management page with fetched rows', async () => {
    renderWithRouter(<RolePage />, '/system/role');

    expect(await screen.findByText('角色管理')).toBeInTheDocument();
    await waitFor(() => {
      expect(roleApi.listRole).toHaveBeenCalled();
    });
  });

  it('renders the menu management page with fetched rows', async () => {
    renderWithRouter(<MenuPage />, '/system/menu');

    expect(await screen.findByText('菜单管理')).toBeInTheDocument();
    await waitFor(() => {
      expect(menuApi.listMenu).toHaveBeenCalled();
    });
  });

  it('renders the department management page with fetched rows', async () => {
    renderWithRouter(<DeptPage />, '/system/dept');

    expect(await screen.findByText('部门管理')).toBeInTheDocument();
    await waitFor(() => {
      expect(deptApi.listDept).toHaveBeenCalled();
    });
  });

  it('renders the post management page with fetched rows', async () => {
    renderWithRouter(<PostPage />, '/system/post');

    expect(await screen.findByText('岗位管理')).toBeInTheDocument();
    await waitFor(() => {
      expect(postApi.listPost).toHaveBeenCalled();
      expect(postApi.deptTreeSelect).toHaveBeenCalled();
    });
  });
});
