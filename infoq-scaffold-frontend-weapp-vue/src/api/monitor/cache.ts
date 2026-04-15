import { request } from '@/api/request';
import type { ApiResponse, CacheVO } from '@/api/types';

export const getCache = () =>
  request<ApiResponse<CacheVO>>({
    url: '/monitor/cache',
    method: 'GET'
  });
