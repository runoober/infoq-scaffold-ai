import { request } from '@/api/request';
import type {
  ApiResponse,
  DictDataQuery,
  DictDataVO,
  DictTypeQuery,
  DictTypeVO,
  TableResponse
} from '@/api/types';

export const getDicts = (dictType: string) =>
  request<ApiResponse<DictDataVO[]>>({
    url: `/system/dict/data/type/${dictType}`,
    method: 'GET'
  });

export const listType = (query: DictTypeQuery) =>
  request<TableResponse<DictTypeVO>, DictTypeQuery>({
    url: '/system/dict/type/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });

export const listData = (query: DictDataQuery) =>
  request<TableResponse<DictDataVO>, DictDataQuery>({
    url: '/system/dict/data/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });
