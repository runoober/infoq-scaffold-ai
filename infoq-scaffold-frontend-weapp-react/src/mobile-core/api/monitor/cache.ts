import { request } from '../../request';
import type { ApiResponse, CacheVO } from '../../types';

export const getCache = () =>
  request<ApiResponse<CacheVO>>({
    url: '/monitor/cache',
    method: 'GET'
  });
