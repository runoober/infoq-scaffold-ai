import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { AtAvatar, AtButton, AtInput, AtIcon } from 'taro-ui';
import {
  getDicts,
  getUserProfile,
  toDictOptions,
  type DictOption,
  type UserForm,
  type UserProfileUpdatePayload,
  updateUserProfile,
  uploadAvatar
} from '@/api';
import { useState } from 'react';
import { useSessionStore } from '../../store/session';
import { backOr, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import './index.scss';

type ProfileFormState = UserForm & { avatar?: string };

const getDisplayName = (userName?: string, nickName?: string) => (nickName || userName || '移动端用户').slice(0, 1).toUpperCase();

export default function ProfileEditPage() {
  const loadSession = useSessionStore((state) => state.loadSession);
  const patchUser = useSessionStore((state) => state.patchUser);
  const [sexOptions, setSexOptions] = useState<DictOption[]>([]);
  const [form, setForm] = useState<ProfileFormState>({
    userName: '',
    nickName: '',
    phonenumber: '',
    email: '',
    sex: '',
    avatar: ''
  });

  useDidShow(() => {
    const run = async () => {
      try {
        const session = await loadSession(true);
        if (!session) {
          Taro.reLaunch({ url: routes.login });
          return;
        }
        const [profileResponse, sexResponse] = await Promise.all([getUserProfile(), getDicts('sys_user_sex')]);
        setSexOptions(toDictOptions(sexResponse.data));
        setForm({
          ...profileResponse.data.user,
          password: '',
          postIds: [],
          roleIds: []
        } as ProfileFormState);
      } catch (error) {
        await handlePageError(error, '基本资料加载失败。');
      }
    };
    void run();
  });

  const handleSave = async () => {
    if (!form.nickName?.trim()) {
      await Taro.showToast({ title: '请输入用户昵称。', icon: 'none' });
      return;
    }
    if (!form.phonenumber?.trim()) {
      await Taro.showToast({ title: '请输入手机号。', icon: 'none' });
      return;
    }
    if (!/^1[3456789][0-9]\d{8}$/.test(form.phonenumber)) {
      await Taro.showToast({ title: '请输入正确的手机号。', icon: 'none' });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      await Taro.showToast({ title: '请输入正确的邮箱地址。', icon: 'none' });
      return;
    }
    const payload: UserProfileUpdatePayload = {
      nickName: form.nickName?.trim(),
      phonenumber: form.phonenumber?.trim(),
      email: form.email?.trim(),
      sex: form.sex
    };
    try {
      await updateUserProfile(payload);
      patchUser({
        avatar: form.avatar,
        email: payload.email,
        nickName: payload.nickName,
        phonenumber: payload.phonenumber,
        sex: payload.sex
      });
      await showSuccess('资料已更新');
      backOr(routes.profile);
    } catch (error) {
      await handlePageError(error, '资料更新失败。');
    }
  };

  const handleChooseAvatar = async () => {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      const filePath = result.tempFilePaths?.[0];
      if (!filePath) {
        return;
      }
      const response = await uploadAvatar(filePath);
      const imgUrl = response.data?.imgUrl || '';
      setForm((prev) => ({ ...prev, avatar: imgUrl }));
      patchUser({ avatar: imgUrl });
      await showSuccess('头像已更新');
    } catch (error) {
      await handlePageError(error, '头像上传失败。');
    }
  };

  return (
    <View className="profile-edit-container">
      <View className="avatar-section">
        <View className="avatar-wrapper" onClick={() => void handleChooseAvatar()}>
          <AtAvatar
            circle
            image={form.avatar || undefined}
            text={getDisplayName(form.userName, form.nickName)}
          />
          <View className="camera-icon">
            <AtIcon value="camera" size="14" color="#fff" />
          </View>
        </View>
        <View className="account-text">
          当前账号: <Text className="account-value">{form.userName || '未命名用户'}</Text>
        </View>
      </View>

      <View className="form-section">
        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">基本信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            <AtInput
              clear
              name="nickName"
              placeholder="请输入用户昵称"
              title="用户昵称"
              value={form.nickName || ''}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, nickName: String(value) }));
                return value;
              }}
            />
            <AtInput
              clear
              name="phonenumber"
              placeholder="请输入手机号"
              title="手机号"
              type="phone"
              value={form.phonenumber || ''}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, phonenumber: String(value) }));
                return value;
              }}
            />
            <AtInput
              clear
              name="email"
              placeholder="请输入邮箱地址"
              title="邮箱"
              value={form.email || ''}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, email: String(value) }));
                return value;
              }}
            />
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">性别</Text>
          </View>
          <View className="card-content">
            <View className="sex-options-horizontal">
              {sexOptions.map((item) => (
                <View
                  key={item.value}
                  className={`sex-option-item ${form.sex === item.value ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, sex: item.value }))}
                >
                  <View className="radio-circle">
                    {form.sex === item.value && <View className="radio-inner" />}
                  </View>
                  <Text className="sex-label">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View className="action-section">
        <AtButton className="save-btn" type="primary" onClick={() => void handleSave()}>
          保存资料
        </AtButton>
        <AtButton className="cancel-btn" onClick={() => backOr(routes.profile)}>
          返回
        </AtButton>
      </View>
    </View>
  );
}
