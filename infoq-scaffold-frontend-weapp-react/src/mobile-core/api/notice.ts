import { request } from '../request';
import type { ApiResponse, NoticeForm, NoticeQuery, NoticeVO, TableResponse } from '../types';

export const listNotice = (query: NoticeQuery) =>
  request<TableResponse<NoticeVO>, NoticeQuery>({
    url: '/system/notice/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });

export const getNotice = (noticeId: string | number) =>
  request<ApiResponse<NoticeVO>>({
    url: `/system/notice/${noticeId}`,
    method: 'GET'
  });

export const addNotice = (data: NoticeForm) =>
  request<ApiResponse<null>, NoticeForm>({
    url: '/system/notice',
    method: 'POST',
    data
  });

export const updateNotice = (data: NoticeForm) =>
  request<ApiResponse<null>, NoticeForm>({
    url: '/system/notice',
    method: 'PUT',
    data
  });

export const delNotice = (noticeId: string | number | Array<string | number>) =>
  request<ApiResponse<null>>({
    url: `/system/notice/${noticeId}`,
    method: 'DELETE'
  });
