import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { AppRoute } from '@/types/router';

// 获取路由
export function getRouters(): AxiosPromise<AppRoute[]> {
  return request({
    url: '/system/menu/getRouters',
    method: 'get'
  });
}
