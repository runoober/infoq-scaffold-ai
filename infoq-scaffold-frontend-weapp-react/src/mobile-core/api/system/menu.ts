import { request } from '../../request';
import type { ApiResponse, DeptTreeVO, MenuForm, MenuQuery, MenuVO } from '../../types';

export const listMenu = (query?: MenuQuery) =>
  request<ApiResponse<MenuVO[]>, MenuQuery>({
    url: '/system/menu/list',
    method: 'GET',
    params: (query || {}) as unknown as Record<string, unknown>
  });

export const getMenu = (menuId: string | number) =>
  request<ApiResponse<MenuVO>>({
    url: `/system/menu/${menuId}`,
    method: 'GET'
  });

export const menuTreeSelect = () =>
  request<ApiResponse<DeptTreeVO[]>>({
    url: '/system/menu/treeselect',
    method: 'GET'
  });

export const addMenu = (data: MenuForm) =>
  request<ApiResponse<null>, MenuForm>({
    url: '/system/menu',
    method: 'POST',
    data
  });

export const updateMenu = (data: MenuForm) =>
  request<ApiResponse<null>, MenuForm>({
    url: '/system/menu',
    method: 'PUT',
    data
  });

export const delMenu = (menuId: string | number) =>
  request<ApiResponse<null>>({
    url: `/system/menu/${menuId}`,
    method: 'DELETE'
  });
