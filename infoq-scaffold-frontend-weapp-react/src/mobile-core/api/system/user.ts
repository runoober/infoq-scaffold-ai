import { request } from '../../request';
import type {
  ApiResponse,
  DeptTreeVO,
  TableResponse,
  UserForm,
  UserInfoVO,
  UserQuery,
  UserVO
} from '../../types';

export const listUser = (query: UserQuery) =>
  request<TableResponse<UserVO>, UserQuery>({
    url: '/system/user/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });

export const optionSelectUsers = (userIds?: Array<string | number>, deptId?: string | number) =>
  request<ApiResponse<UserVO[]>>({
    url: '/system/user/optionselect',
    method: 'GET',
    params: {
      userIds,
      deptId
    }
  });

export const getUser = (userId?: string | number) =>
  request<ApiResponse<UserInfoVO>>({
    url: userId === undefined || userId === '' ? '/system/user/' : `/system/user/${userId}`,
    method: 'GET'
  });

export const addUser = (data: UserForm) =>
  request<ApiResponse<null>, UserForm>({
    url: '/system/user',
    method: 'POST',
    data
  });

export const updateUser = (data: UserForm) =>
  request<ApiResponse<null>, UserForm>({
    url: '/system/user',
    method: 'PUT',
    data
  });

export const delUser = (userId: Array<string | number> | string | number) =>
  request<ApiResponse<null>>({
    url: `/system/user/${userId}`,
    method: 'DELETE'
  });

export const changeUserStatus = (userId: string | number, status: string) =>
  request<ApiResponse<null>, { userId: string | number; status: string }>({
    url: '/system/user/changeStatus',
    method: 'PUT',
    data: {
      userId,
      status
    }
  });

export const resetUserPwd = (userId: string | number, password: string) =>
  request<ApiResponse<null>, { userId: string | number; password: string }>({
    url: '/system/user/resetPwd',
    method: 'PUT',
    headers: {
      isEncrypt: true,
      repeatSubmit: false
    },
    data: {
      userId,
      password
    }
  });

export const deptTreeSelectForUser = () =>
  request<ApiResponse<DeptTreeVO[]>>({
    url: '/system/user/deptTree',
    method: 'GET'
  });

export const listUserByDeptId = (deptId: string | number) =>
  request<ApiResponse<UserVO[]>>({
    url: `/system/user/list/dept/${deptId}`,
    method: 'GET'
  });
