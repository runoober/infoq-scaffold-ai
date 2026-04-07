import { listLoginInfo } from './api/monitor/loginInfo';
import { listOnlineUsers } from './api/monitor/online';
import { listRole } from './api/system/role';
import { listUser } from './api/system/user';
import { resolveTableTotal } from './helpers';

export type AdminModuleGroup = 'system' | 'monitor';
export type AdminModuleKey =
  | 'users'
  | 'roles'
  | 'depts'
  | 'posts'
  | 'menus'
  | 'notices'
  | 'dicts'
  | 'online'
  | 'loginInfo'
  | 'operLog'
  | 'cache';

export interface AdminModuleMeta {
  key: AdminModuleKey;
  group: AdminModuleGroup;
  title: string;
  description: string;
  permission: string;
  badge: string;
}

export interface WorkbenchSummary {
  userTotal: number;
  roleTotal: number;
  onlineTotal: number;
  loginTotal: number;
}

export const mobileAdminModules: AdminModuleMeta[] = [
  { key: 'users', group: 'system', title: '用户管理', description: '维护账号、部门和登录状态', permission: 'system:user:list', badge: 'USR' },
  { key: 'roles', group: 'system', title: '角色管理', description: '维护角色标识和启停状态', permission: 'system:role:list', badge: 'ROL' },
  { key: 'depts', group: 'system', title: '部门管理', description: '维护组织结构和联系人信息', permission: 'system:dept:list', badge: 'DPT' },
  { key: 'posts', group: 'system', title: '岗位管理', description: '维护岗位编码、归属部门和状态', permission: 'system:post:list', badge: 'PST' },
  { key: 'menus', group: 'system', title: '菜单管理', description: '维护移动端可见路由和权限标识', permission: 'system:menu:list', badge: 'MNU' },
  { key: 'notices', group: 'system', title: '公告管理', description: '发布、编辑和下线系统公告', permission: 'system:notice:list', badge: 'NTC' },
  { key: 'dicts', group: 'system', title: '字典管理', description: '维护系统数据字典类型和数据项', permission: 'system:dict:list', badge: 'DCT' },
  { key: 'loginInfo', group: 'monitor', title: '登录日志', description: '查看登录记录并解锁账号', permission: 'monitor:loginInfo:list', badge: 'LGN' },
  { key: 'operLog', group: 'monitor', title: '操作日志', description: '查看操作记录和失败详情', permission: 'monitor:operLog:list', badge: 'OPR' },
  { key: 'online', group: 'monitor', title: '在线用户', description: '查看当前在线设备并执行强退', permission: 'monitor:online:list', badge: 'ONL' },
  { key: 'cache', group: 'monitor', title: '缓存概览', description: '查看 Redis 指标和命令统计', permission: 'monitor:cache:list', badge: 'RDS' }
];

export const loadWorkbenchSummary = async (permissions: string[]): Promise<WorkbenchSummary> => {
  const [userResponse, roleResponse, onlineResponse, loginResponse] = await Promise.all([
    permissions.includes('system:user:list')
      ? listUser({
          pageNum: 1,
          pageSize: 1,
          userName: '',
          nickName: '',
          phonenumber: '',
          status: ''
        })
      : Promise.resolve(undefined),
    permissions.includes('system:role:list')
      ? listRole({
          pageNum: 1,
          pageSize: 1,
          roleName: '',
          roleKey: '',
          status: ''
        })
      : Promise.resolve(undefined),
    permissions.includes('monitor:online:list')
      ? listOnlineUsers({
          pageNum: 1,
          pageSize: 1,
          ipaddr: '',
          userName: ''
        })
      : Promise.resolve(undefined),
    permissions.includes('monitor:loginInfo:list')
      ? listLoginInfo({
          pageNum: 1,
          pageSize: 1,
          ipaddr: '',
          userName: '',
          status: '',
          orderByColumn: 'loginTime',
          isAsc: 'descending'
        })
      : Promise.resolve(undefined)
  ]);

  return {
    userTotal: resolveTableTotal(userResponse),
    roleTotal: resolveTableTotal(roleResponse),
    onlineTotal: resolveTableTotal(onlineResponse),
    loginTotal: resolveTableTotal(loginResponse)
  };
};
