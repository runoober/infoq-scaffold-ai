import { request } from '@/api/request';
import type { ApiResponse, OnlineQuery, OnlineVO, TableResponse } from '@/api/types';

export const listOnlineUsers = (query: OnlineQuery) =>
  request<TableResponse<OnlineVO>, OnlineQuery>({
    url: '/monitor/online/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });

export const forceLogout = (tokenId: string) =>
  request<ApiResponse<null>>({
    url: `/monitor/online/${tokenId}`,
    method: 'DELETE'
  });
