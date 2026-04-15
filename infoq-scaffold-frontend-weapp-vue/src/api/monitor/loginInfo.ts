import { request } from '@/api/request';
import type { ApiResponse, LoginInfoQuery, LoginInfoVO, TableResponse } from '@/api/types';

export const listLoginInfo = (query: LoginInfoQuery) =>
  request<TableResponse<LoginInfoVO>, LoginInfoQuery>({
    url: '/monitor/loginInfo/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });

export const delLoginInfo = (infoId: string | number | Array<string | number>) =>
  request<ApiResponse<null>>({
    url: `/monitor/loginInfo/${infoId}`,
    method: 'DELETE'
  });

export const unlockLoginInfo = (userName: string) =>
  request<ApiResponse<null>>({
    url: `/monitor/loginInfo/unlock/${userName}`,
    method: 'GET'
  });

export const cleanLoginInfo = () =>
  request<ApiResponse<null>>({
    url: '/monitor/loginInfo/clean',
    method: 'DELETE'
  });
