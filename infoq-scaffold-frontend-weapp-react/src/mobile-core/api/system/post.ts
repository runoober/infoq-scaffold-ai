import { request } from '../../request';
import type { ApiResponse, DeptTreeVO, PostForm, PostQuery, PostVO, TableResponse } from '../../types';

export const listPost = (query: PostQuery) =>
  request<TableResponse<PostVO>, PostQuery>({
    url: '/system/post/list',
    method: 'GET',
    params: query as unknown as Record<string, unknown>
  });

export const getPost = (postId: string | number) =>
  request<ApiResponse<PostVO>>({
    url: `/system/post/${postId}`,
    method: 'GET'
  });

export const optionSelectPosts = (deptId?: string | number, postIds?: Array<string | number>) =>
  request<ApiResponse<PostVO[]>>({
    url: '/system/post/optionselect',
    method: 'GET',
    params: {
      deptId,
      postIds
    }
  });

export const addPost = (data: PostForm) =>
  request<ApiResponse<null>, PostForm>({
    url: '/system/post',
    method: 'POST',
    data
  });

export const updatePost = (data: PostForm) =>
  request<ApiResponse<null>, PostForm>({
    url: '/system/post',
    method: 'PUT',
    data
  });

export const delPost = (postId: Array<string | number> | string | number) =>
  request<ApiResponse<null>>({
    url: `/system/post/${postId}`,
    method: 'DELETE'
  });

export const deptTreeSelectForPost = () =>
  request<ApiResponse<DeptTreeVO[]>>({
    url: '/system/post/deptTree',
    method: 'GET'
  });
