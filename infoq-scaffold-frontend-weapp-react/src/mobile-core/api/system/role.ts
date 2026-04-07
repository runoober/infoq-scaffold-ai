import { request } from '../../request';
import type {
  ApiResponse,
  DeptTreeVO,
  RoleForm,
  RoleQuery,
  RoleVO,
  TableResponse,
  UserQuery,
  UserVO
} from '../../types';

export const listRole = (query: RoleQuery) =>
  request<TableResponse<RoleVO>, RoleQuery>({
    url: '/system/role/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });

export const optionSelectRoles = (roleIds?: Array<string | number>) =>
  request<ApiResponse<RoleVO[]>>({
    url: '/system/role/optionselect',
    method: 'GET',
    params: {
      roleIds
    }
  });

export const getRole = (roleId: string | number) =>
  request<ApiResponse<RoleVO>>({
    url: `/system/role/${roleId}`,
    method: 'GET'
  });

export const addRole = (data: RoleForm) =>
  request<ApiResponse<null>, RoleForm>({
    url: '/system/role',
    method: 'POST',
    data
  });

export const updateRole = (data: RoleForm) =>
  request<ApiResponse<null>, RoleForm>({
    url: '/system/role',
    method: 'PUT',
    data
  });

export const changeRoleStatus = (roleId: string | number, status: string) =>
  request<ApiResponse<null>, { roleId: string | number; status: string }>({
    url: '/system/role/changeStatus',
    method: 'PUT',
    data: {
      roleId,
      status
    }
  });

export const delRole = (roleId: Array<string | number> | string | number) =>
  request<ApiResponse<null>>({
    url: `/system/role/${roleId}`,
    method: 'DELETE'
  });

export const roleDeptTreeSelect = (roleId: string | number) =>
  request<ApiResponse<{ checkedKeys: Array<string | number>; depts: DeptTreeVO[] }>>({
    url: `/system/role/deptTree/${roleId}`,
    method: 'GET'
  });

export const allocatedUserList = (query: UserQuery) =>
  request<TableResponse<UserVO>, UserQuery>({
    url: '/system/role/authUser/allocatedList',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });
