import { request } from '../../request';
import type { ApiResponse, OnlineQuery, OnlineVO, TableResponse } from '../../types';

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
