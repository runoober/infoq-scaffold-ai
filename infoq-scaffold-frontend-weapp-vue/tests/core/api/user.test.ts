import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequest, mockUploadFile } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
  mockUploadFile: vi.fn()
}));

vi.mock('../../../src/api/request', () => ({
  request: mockRequest,
  uploadFile: mockUploadFile
}));

import { updateUserProfile } from '../../../src/api/user';

describe('api/user', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockUploadFile.mockReset();
    mockRequest.mockResolvedValue({ code: 200, data: null });
  });

  it('updateUserProfile should only submit backend supported fields', async () => {
    await updateUserProfile({
      userId: '1',
      deptId: 103,
      userName: 'admin',
      nickName: 'Pontus',
      email: 'luckykuang@foxmail.com',
      phonenumber: '15888888888',
      sex: '0',
      roleIds: ['1'],
      postIds: ['1']
    });

    expect(mockRequest).toHaveBeenCalledTimes(1);
    const requestOptions = mockRequest.mock.calls[0][0];
    expect(requestOptions).toMatchObject({
      url: '/system/user/profile',
      method: 'PUT',
      data: {
        nickName: 'Pontus',
        email: 'luckykuang@foxmail.com',
        phonenumber: '15888888888',
        sex: '0'
      }
    });
    expect(requestOptions.data).not.toHaveProperty('userId');
    expect(requestOptions.data).not.toHaveProperty('deptId');
    expect(requestOptions.data).not.toHaveProperty('roleIds');
  });
});
