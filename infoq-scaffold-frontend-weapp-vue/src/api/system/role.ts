import { request } from '@/api/request';
import type {
  ApiResponse,
  RoleForm,
  RoleQuery,
  RoleVO,
  TableResponse
} from '@/api/types';

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
