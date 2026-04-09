import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequest, mockUploadFile } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
  mockUploadFile: vi.fn()
}));

vi.mock('../../../src/api/request', () => ({
  request: mockRequest,
  uploadFile: mockUploadFile
}));

vi.mock('../../../src/utils/env', () => ({
  mobileEnv: {
    clientId: 'test-client-id'
  }
}));

import { getCodeImg, getInfo, login, logout } from '../../../src/api/auth';
import { getDicts, listData, listType } from '../../../src/api/dict';
import { getCache } from '../../../src/api/monitor/cache';
import {
  cleanLoginInfo,
  delLoginInfo,
  listLoginInfo,
  unlockLoginInfo
} from '../../../src/api/monitor/loginInfo';
import { forceLogout, listOnlineUsers } from '../../../src/api/monitor/online';
import { cleanOperLog, delOperLog, listOperLog } from '../../../src/api/monitor/operLog';
import { addNotice, delNotice, getNotice, listNotice, updateNotice } from '../../../src/api/notice';
import { addDept, delDept, getDept, listDept, updateDept } from '../../../src/api/system/dept';
import { addMenu, delMenu, getMenu, listMenu, menuTreeSelect, updateMenu } from '../../../src/api/system/menu';
import {
  addPost,
  delPost,
  deptTreeSelectForPost,
  getPost,
  listPost,
  updatePost
} from '../../../src/api/system/post';
import {
  addRole,
  changeRoleStatus,
  delRole,
  getRole,
  listRole,
  optionSelectRoles,
  updateRole
} from '../../../src/api/system/role';
import {
  addUser,
  changeUserStatus,
  delUser,
  deptTreeSelectForUser,
  getUser,
  listUser,
  updateUser
} from '../../../src/api/system/user';
import {
  getUserProfile,
  updateUserProfile,
  updateUserPwd,
  uploadAvatar
} from '../../../src/api/user';

describe('api contracts', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockUploadFile.mockReset();
    mockRequest.mockResolvedValue({ code: 200, data: null });
    mockUploadFile.mockResolvedValue({ code: 200, data: null });
  });

  it('auth api should map request options correctly', async () => {
    await login({ username: 'u1', password: 'p1', code: '1234', uuid: 'uuid-1' });
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/auth/login',
      method: 'POST',
      headers: {
        isToken: false,
        isEncrypt: true,
        repeatSubmit: false
      },
      data: {
        username: 'u1',
        password: 'p1',
        code: '1234',
        uuid: 'uuid-1',
        clientId: 'test-client-id',
        grantType: 'password'
      }
    });

    await login({
      username: 'u2',
      password: 'p2',
      code: '5678',
      uuid: 'uuid-2',
      clientId: 'override-client',
      grantType: 'sms'
    });
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      data: {
        username: 'u2',
        password: 'p2',
        code: '5678',
        uuid: 'uuid-2',
        clientId: 'override-client',
        grantType: 'sms'
      }
    });

    await logout();
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      url: '/auth/logout',
      method: 'POST'
    });

    await getCodeImg();
    expect(mockRequest.mock.calls[3][0]).toMatchObject({
      url: '/auth/code',
      method: 'GET',
      headers: {
        isToken: false
      },
      timeout: 20000
    });

    await getInfo();
    expect(mockRequest.mock.calls[4][0]).toMatchObject({
      url: '/system/user/getInfo',
      method: 'GET'
    });
  });

  it('dict api should map request options correctly', async () => {
    await getDicts('notice_type');
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/system/dict/data/type/notice_type',
      method: 'GET'
    });

    await listType({ pageNum: 1, pageSize: 20 });
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      url: '/system/dict/type/list',
      method: 'GET',
      params: { pageNum: 1, pageSize: 20 }
    });

    await listData({ dictType: 'notice_type' });
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      url: '/system/dict/data/list',
      method: 'GET',
      params: { dictType: 'notice_type' }
    });
  });

  it('notice api should map request options correctly', async () => {
    await listNotice({ pageNum: 1, pageSize: 10, noticeTitle: '', noticeType: '', createBy: '' });
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/system/notice/list',
      method: 'GET'
    });

    await getNotice(99);
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      url: '/system/notice/99',
      method: 'GET'
    });

    await addNotice({ noticeTitle: 'n1', noticeType: '1', status: '0', noticeContent: 'content' });
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      url: '/system/notice',
      method: 'POST'
    });

    await updateNotice({ noticeId: 9, noticeTitle: 'n2', noticeType: '2', status: '1', noticeContent: 'changed' });
    expect(mockRequest.mock.calls[3][0]).toMatchObject({
      url: '/system/notice',
      method: 'PUT'
    });

    await delNotice([10, 11]);
    expect(mockRequest.mock.calls[4][0]).toMatchObject({
      url: '/system/notice/10,11',
      method: 'DELETE'
    });
  });

  it('user profile api should map request and upload options correctly', async () => {
    await getUserProfile();
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/system/user/profile',
      method: 'GET'
    });

    await updateUserProfile({
      userId: 1,
      userName: 'admin',
      nickName: 'Admin',
      email: 'admin@example.com',
      phonenumber: '13800000000',
      sex: '0',
      roleIds: ['1']
    });
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      url: '/system/user/profile',
      method: 'PUT',
      data: {
        nickName: 'Admin',
        email: 'admin@example.com',
        phonenumber: '13800000000',
        sex: '0'
      }
    });

    await uploadAvatar('/tmp/avatar.png');
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(mockUploadFile.mock.calls[0][0]).toMatchObject({
      url: '/system/user/profile/avatar',
      filePath: '/tmp/avatar.png',
      name: 'avatarfile'
    });

    await updateUserPwd('old-pass', 'new-pass');
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      url: '/system/user/profile/updatePwd',
      method: 'PUT',
      headers: {
        isEncrypt: true,
        repeatSubmit: false
      },
      data: {
        oldPassword: 'old-pass',
        newPassword: 'new-pass'
      }
    });
  });

  it('system user api should map request options and optional userId branch', async () => {
    await listUser({ pageNum: 1, pageSize: 10, userName: '', nickName: '', phonenumber: '', status: '' });
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/system/user/list',
      method: 'GET'
    });

    await getUser();
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      url: '/system/user/',
      method: 'GET'
    });

    await getUser('');
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      url: '/system/user/',
      method: 'GET'
    });

    await getUser(88);
    expect(mockRequest.mock.calls[3][0]).toMatchObject({
      url: '/system/user/88',
      method: 'GET'
    });

    await addUser({ userName: 'u', nickName: 'n', password: 'p', roleIds: ['1'], postIds: ['2'] });
    expect(mockRequest.mock.calls[4][0]).toMatchObject({
      url: '/system/user',
      method: 'POST'
    });

    await updateUser({ userId: 88, userName: 'u2', nickName: 'n2' });
    expect(mockRequest.mock.calls[5][0]).toMatchObject({
      url: '/system/user',
      method: 'PUT'
    });

    await delUser([1, 2]);
    expect(mockRequest.mock.calls[6][0]).toMatchObject({
      url: '/system/user/1,2',
      method: 'DELETE'
    });

    await changeUserStatus(88, '1');
    expect(mockRequest.mock.calls[7][0]).toMatchObject({
      url: '/system/user/changeStatus',
      method: 'PUT',
      data: {
        userId: 88,
        status: '1'
      }
    });

    await deptTreeSelectForUser();
    expect(mockRequest.mock.calls[8][0]).toMatchObject({
      url: '/system/user/deptTree',
      method: 'GET'
    });
  });

  it('system role api should map request options correctly', async () => {
    await listRole({ pageNum: 1, pageSize: 10, roleName: '', roleKey: '', status: '' });
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/system/role/list',
      method: 'GET'
    });

    await optionSelectRoles();
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      url: '/system/role/optionselect',
      method: 'GET',
      params: {
        roleIds: undefined
      }
    });

    await optionSelectRoles([1, 2]);
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      params: {
        roleIds: [1, 2]
      }
    });

    await getRole(3);
    expect(mockRequest.mock.calls[3][0]).toMatchObject({
      url: '/system/role/3',
      method: 'GET'
    });

    await addRole({ roleName: 'r1', roleKey: 'key1', roleSort: 1, status: '0', menuIds: [1] });
    expect(mockRequest.mock.calls[4][0]).toMatchObject({
      url: '/system/role',
      method: 'POST'
    });

    await updateRole({ roleId: 3, roleName: 'r2', roleKey: 'key2', roleSort: 2, status: '1', menuIds: [1, 2] });
    expect(mockRequest.mock.calls[5][0]).toMatchObject({
      url: '/system/role',
      method: 'PUT'
    });

    await changeRoleStatus(3, '1');
    expect(mockRequest.mock.calls[6][0]).toMatchObject({
      url: '/system/role/changeStatus',
      method: 'PUT',
      data: {
        roleId: 3,
        status: '1'
      }
    });

    await delRole([3, 4]);
    expect(mockRequest.mock.calls[7][0]).toMatchObject({
      url: '/system/role/3,4',
      method: 'DELETE'
    });
  });

  it('system dept api should map request options including optional query branch', async () => {
    await listDept();
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/system/dept/list',
      method: 'GET',
      params: {}
    });

    await listDept({ deptName: '研发', status: '0' });
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      params: {
        deptName: '研发',
        status: '0'
      }
    });

    await getDept(6);
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      url: '/system/dept/6',
      method: 'GET'
    });

    await addDept({ deptName: '研发一部', parentId: 100, orderNum: 1 });
    expect(mockRequest.mock.calls[3][0]).toMatchObject({
      url: '/system/dept',
      method: 'POST'
    });

    await updateDept({ deptId: 6, deptName: '研发二部', parentId: 100, orderNum: 2 });
    expect(mockRequest.mock.calls[4][0]).toMatchObject({
      url: '/system/dept',
      method: 'PUT'
    });

    await delDept(6);
    expect(mockRequest.mock.calls[5][0]).toMatchObject({
      url: '/system/dept/6',
      method: 'DELETE'
    });
  });

  it('system menu and post api should map request options including optional query branch', async () => {
    await listMenu();
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/system/menu/list',
      method: 'GET',
      params: {}
    });

    await listMenu({ menuName: '系统管理', status: '0' });
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      params: {
        menuName: '系统管理',
        status: '0'
      }
    });

    await getMenu(8);
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      url: '/system/menu/8',
      method: 'GET'
    });

    await menuTreeSelect();
    expect(mockRequest.mock.calls[3][0]).toMatchObject({
      url: '/system/menu/treeselect',
      method: 'GET'
    });

    await addMenu({ menuName: '用户管理', parentId: 0, orderNum: 1, menuType: 'C' });
    expect(mockRequest.mock.calls[4][0]).toMatchObject({
      url: '/system/menu',
      method: 'POST'
    });

    await updateMenu({ menuId: 8, menuName: '角色管理', parentId: 0, orderNum: 2, menuType: 'C' });
    expect(mockRequest.mock.calls[5][0]).toMatchObject({
      url: '/system/menu',
      method: 'PUT'
    });

    await delMenu(8);
    expect(mockRequest.mock.calls[6][0]).toMatchObject({
      url: '/system/menu/8',
      method: 'DELETE'
    });

    await listPost({ pageNum: 1, pageSize: 10, postCode: '', postName: '', status: '' });
    expect(mockRequest.mock.calls[7][0]).toMatchObject({
      url: '/system/post/list',
      method: 'GET'
    });

    await getPost(9);
    expect(mockRequest.mock.calls[8][0]).toMatchObject({
      url: '/system/post/9',
      method: 'GET'
    });

    await addPost({ postCode: 'DEV', postName: '开发', postSort: 1, status: '0' });
    expect(mockRequest.mock.calls[9][0]).toMatchObject({
      url: '/system/post',
      method: 'POST'
    });

    await updatePost({ postId: 9, postCode: 'OPS', postName: '运维', postSort: 2, status: '1' });
    expect(mockRequest.mock.calls[10][0]).toMatchObject({
      url: '/system/post',
      method: 'PUT'
    });

    await delPost([9, 10]);
    expect(mockRequest.mock.calls[11][0]).toMatchObject({
      url: '/system/post/9,10',
      method: 'DELETE'
    });

    await deptTreeSelectForPost();
    expect(mockRequest.mock.calls[12][0]).toMatchObject({
      url: '/system/post/deptTree',
      method: 'GET'
    });
  });

  it('monitor api should map request options correctly', async () => {
    await getCache();
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      url: '/monitor/cache',
      method: 'GET'
    });

    await listOnlineUsers({ pageNum: 1, pageSize: 10, ipaddr: '', userName: '' });
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      url: '/monitor/online/list',
      method: 'GET'
    });

    await forceLogout('token-id-1');
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      url: '/monitor/online/token-id-1',
      method: 'DELETE'
    });

    await listLoginInfo({
      pageNum: 1,
      pageSize: 10,
      ipaddr: '',
      userName: '',
      status: '',
      orderByColumn: 'loginTime',
      isAsc: 'descending'
    });
    expect(mockRequest.mock.calls[3][0]).toMatchObject({
      url: '/monitor/loginInfo/list',
      method: 'GET'
    });

    await delLoginInfo([1, 2]);
    expect(mockRequest.mock.calls[4][0]).toMatchObject({
      url: '/monitor/loginInfo/1,2',
      method: 'DELETE'
    });

    await unlockLoginInfo('admin');
    expect(mockRequest.mock.calls[5][0]).toMatchObject({
      url: '/monitor/loginInfo/unlock/admin',
      method: 'GET'
    });

    await cleanLoginInfo();
    expect(mockRequest.mock.calls[6][0]).toMatchObject({
      url: '/monitor/loginInfo/clean',
      method: 'DELETE'
    });

    await listOperLog({ pageNum: 1, pageSize: 10, title: '', businessType: '', operName: '' });
    expect(mockRequest.mock.calls[7][0]).toMatchObject({
      url: '/monitor/operLog/list',
      method: 'GET'
    });

    await delOperLog([7, 8]);
    expect(mockRequest.mock.calls[8][0]).toMatchObject({
      url: '/monitor/operLog/7,8',
      method: 'DELETE'
    });

    await cleanOperLog();
    expect(mockRequest.mock.calls[9][0]).toMatchObject({
      url: '/monitor/operLog/clean',
      method: 'DELETE'
    });
  });
});
