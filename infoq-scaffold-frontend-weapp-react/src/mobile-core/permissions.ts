import { mobileAdminModules } from './admin';

export const ALL_PERMISSION = '*:*:*';

const mobilePermissionFallbacks = [
  ...mobileAdminModules.map((item) => item.permission),
  'system:notice:query',
  'system:notice:add',
  'system:notice:edit',
  'system:notice:remove',
  'system:user:add',
  'system:user:edit',
  'system:user:remove',
  'system:role:add',
  'system:role:edit',
  'system:role:remove',
  'system:dept:add',
  'system:dept:edit',
  'system:dept:remove',
  'system:post:add',
  'system:post:edit',
  'system:post:remove',
  'system:menu:add',
  'system:menu:edit',
  'system:menu:remove',
  'monitor:online:forceLogout',
  'monitor:loginInfo:remove',
  'monitor:loginInfo:unlock',
  'monitor:operLog:query',
  'monitor:operLog:remove'
] as const;

export const normalizePermissions = (permissions: string[] = []) => {
  if (!permissions.includes(ALL_PERMISSION)) {
    return permissions;
  }
  return Array.from(new Set([...permissions, ...mobilePermissionFallbacks]));
};

export const hasPermission = (permissions: string[] = [], permission: string) =>
  permissions.includes(ALL_PERMISSION) || permissions.includes(permission);
