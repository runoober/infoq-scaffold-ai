import { request } from '@/api/request';
import type { ApiResponse, DictDataVO } from '@/api/types';

export const getDicts = (dictType: string) =>
  request<ApiResponse<DictDataVO[]>>({
    url: `/system/dict/data/type/${dictType}`,
    method: 'GET'
  });

export const listType = (query: any) =>
  request<any>({
    url: '/system/dict/type/list',
    method: 'GET',
    params: query
  });

export const listData = (query: any) =>
  request<any>({
    url: '/system/dict/data/list',
    method: 'GET',
    params: query
  });
