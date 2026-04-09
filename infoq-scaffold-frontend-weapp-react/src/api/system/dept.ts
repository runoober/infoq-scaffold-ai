import { request } from '@/api/request';
import type { ApiResponse, DeptForm, DeptQuery, DeptVO } from '@/api/types';

export const listDept = (query?: DeptQuery) =>
  request<ApiResponse<DeptVO[]>, DeptQuery>({
    url: '/system/dept/list',
    method: 'GET',
    params: (query || {}) as unknown as Record<string, unknown>
  });

export const getDept = (deptId: string | number) =>
  request<ApiResponse<DeptVO>>({
    url: `/system/dept/${deptId}`,
    method: 'GET'
  });

export const addDept = (data: DeptForm) =>
  request<ApiResponse<null>, DeptForm>({
    url: '/system/dept',
    method: 'POST',
    data
  });

export const updateDept = (data: DeptForm) =>
  request<ApiResponse<null>, DeptForm>({
    url: '/system/dept',
    method: 'PUT',
    data
  });

export const delDept = (deptId: string | number) =>
  request<ApiResponse<null>>({
    url: `/system/dept/${deptId}`,
    method: 'DELETE'
  });
