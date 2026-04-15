import { mobileAdminModules, type AdminModuleKey } from '@/api';
import { routes } from './navigation';

const adminRouteMap: Record<AdminModuleKey, string> = {
  users: routes.users,
  roles: routes.roles,
  depts: routes.depts,
  posts: routes.posts,
  menus: routes.menus,
  dicts: routes.dicts,
  notices: routes.notices,
  online: routes.online,
  loginInfo: routes.loginInfo,
  operLog: routes.operLog,
  cache: routes.cache
};

export const adminModules = mobileAdminModules.map((item) => ({
  ...item,
  url: adminRouteMap[item.key]
}));

export const systemAdminModules = adminModules.filter((item) => item.group === 'system');
export const monitorAdminModules = adminModules.filter((item) => item.group === 'monitor');
