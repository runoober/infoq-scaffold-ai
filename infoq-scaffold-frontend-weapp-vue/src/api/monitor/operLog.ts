import { request } from '@/api/request';
import type { ApiResponse, OperLogQuery, OperLogVO, TableResponse } from '@/api/types';

export const listOperLog = (query: OperLogQuery) =>
  request<TableResponse<OperLogVO>, OperLogQuery>({
    url: '/monitor/operLog/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });

export const delOperLog = (operId: string | number | Array<string | number>) =>
  request<ApiResponse<null>>({
    url: `/monitor/operLog/${operId}`,
    method: 'DELETE'
  });

export const cleanOperLog = () =>
  request<ApiResponse<null>>({
    url: '/monitor/operLog/clean',
    method: 'DELETE'
  });
