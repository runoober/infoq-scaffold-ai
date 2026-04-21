import { request } from '@/api/request';
import type {
  ApiResponse,
  DictDataQuery,
  DictDataVO,
  DictTypeQuery,
  DictTypeVO,
  TableResponse
} from '@/api/types';

type DictTypeListQuery = Partial<DictTypeQuery>;
type DictDataListQuery = Partial<DictDataQuery>;

export const getDicts = (dictType: string) =>
  request<ApiResponse<DictDataVO[]>>({
    url: `/system/dict/data/type/${dictType}`,
    method: 'GET'
  });

export const listType = (query: DictTypeListQuery) =>
  request<TableResponse<DictTypeVO>>({
    url: '/system/dict/type/list',
    method: 'GET',
    params: query
  });

export const listData = (query: DictDataListQuery) =>
  request<TableResponse<DictDataVO>>({
    url: '/system/dict/data/list',
    method: 'GET',
    params: query
  });
