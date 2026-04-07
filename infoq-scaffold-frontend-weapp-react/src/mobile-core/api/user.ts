import { request, uploadFile } from '../request';
import type { ApiResponse, UserForm, UserInfoVO, UserProfileUpdatePayload } from '../types';

export const getUserProfile = () =>
  request<ApiResponse<UserInfoVO>>({
    url: '/system/user/profile',
    method: 'GET'
  });

const toUserProfileUpdatePayload = (data: Partial<UserForm>): UserProfileUpdatePayload => ({
  nickName: data.nickName,
  email: data.email,
  phonenumber: data.phonenumber,
  sex: data.sex
});

export const updateUserProfile = (data: Partial<UserForm>) =>
  request<ApiResponse<null>, UserProfileUpdatePayload>({
    url: '/system/user/profile',
    method: 'PUT',
    data: toUserProfileUpdatePayload(data)
  });

export const uploadAvatar = (filePath: string) =>
  uploadFile<ApiResponse<{ imgUrl?: string }>>({
    url: '/system/user/profile/avatar',
    filePath,
    name: 'avatarfile'
  });

export const updateUserPwd = (oldPassword: string, newPassword: string) =>
  request<ApiResponse<null>>({
    url: '/system/user/profile/updatePwd',
    method: 'PUT',
    headers: {
      isEncrypt: true,
      repeatSubmit: false
    },
    data: {
      oldPassword,
      newPassword
    }
  });
