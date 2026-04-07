import { request } from '../../request';
import type { ApiResponse, DeptForm, DeptQuery, DeptVO } from '../../types';

export const listDept = (query?: DeptQuery) =>
  request<ApiResponse<DeptVO[]>, DeptQuery>({
    url: '/system/dept/list',
    method: 'GET',
    params: (query || {}) as unknown as Record<string, unknown>
  });

export const optionSelectDepts = (deptIds?: Array<string | number>) =>
  request<ApiResponse<DeptVO[]>>({
    url: '/system/dept/optionselect',
    method: 'GET',
    params: {
      deptIds
    }
  });

export const listDeptExcludeChild = (deptId: string | number) =>
  request<ApiResponse<DeptVO[]>>({
    url: `/system/dept/list/exclude/${deptId}`,
    method: 'GET'
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
