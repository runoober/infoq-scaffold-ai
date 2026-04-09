import { View, Text, Picker } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import {
  addUser,
  deptTreeSelectForUser,
  flattenTree,
  getDicts,
  getUser,
  optionSelectRoles,
  toDictOptions,
  updateUser,
  type DeptTreeVO,
  type DictOption,
  type FlatTreeItem,
  type RoleVO,
  type UserForm
} from '@/api';
import { useState } from 'react';
import { AtButton, AtInput } from 'taro-ui';
import { routes } from '../../../utils/navigation';
import { handlePageError, showSuccess } from '../../../utils/ui';
import { useSessionStore } from '../../../store/session';
import './index.scss';

const createForm = (): UserForm => ({
  userId: undefined,
  deptId: undefined,
  userName: '',
  nickName: '',
  password: '',
  phonenumber: '',
  email: '',
  sex: '2',
  status: '0',
  remark: '',
  postIds: [],
  roleIds: []
});

const normalizeIdList = (items?: Array<string | number>) => (items || []).map((item) => String(item));

export default function UserFormPage() {
  const router = useRouter();
  const userId = router.params.userId;
  const loadSession = useSessionStore((state) => state.loadSession);
  const [form, setForm] = useState<UserForm>(createForm());
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [sexOptions, setSexOptions] = useState<DictOption[]>([]);
  const [deptOptions, setDeptOptions] = useState<Array<FlatTreeItem<DeptTreeVO>>>([]);
  const [roleOptions, setRoleOptions] = useState<RoleVO[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }

      const [statusRes, sexRes, deptRes, roleRes] = await Promise.all([
        getDicts('sys_normal_disable'),
        getDicts('sys_user_sex'),
        deptTreeSelectForUser(),
        optionSelectRoles()
      ]);

      setStatusOptions(toDictOptions(statusRes.data));
      setSexOptions(toDictOptions(sexRes.data));
      setDeptOptions(flattenTree(deptRes.data));
      setRoleOptions(roleRes.data || []);

      if (userId) {
        const response = await getUser(userId);
        const { user, roleIds, postIds } = response.data;
        setForm({
          userId: String(user.userId),
          deptId: user.deptId,
          userName: user.userName,
          nickName: user.nickName,
          phonenumber: user.phonenumber,
          email: user.email,
          sex: user.sex,
          status: user.status,
          remark: user.remark,
          roleIds: normalizeIdList(roleIds),
          postIds: normalizeIdList(postIds)
        });
      }
    } catch (error) {
      await handlePageError(error, '加载失败');
    }
  };

  useDidShow(() => {
    void loadData();
  });

  const handleSave = async () => {
    if (!form.deptId) {
      await Taro.showToast({ title: '请选择所属部门', icon: 'none' });
      return;
    }
    if (!form.userName?.trim()) {
      await Taro.showToast({ title: '请输入登录账号', icon: 'none' });
      return;
    }
    if (!form.nickName?.trim()) {
      await Taro.showToast({ title: '请输入用户昵称', icon: 'none' });
      return;
    }
    if (!userId && !form.password?.trim()) {
      await Taro.showToast({ title: '请输入初始密码', icon: 'none' });
      return;
    }
    if (!(form.roleIds || []).length) {
      await Taro.showToast({ title: '至少选择一个角色', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (userId) {
        await updateUser(payload);
      } else {
        await addUser(payload);
      }
      await showSuccess(userId ? '用户已更新' : '用户已创建');
      Taro.navigateBack();
    } catch (error) {
      await handlePageError(error, '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDept = deptOptions.find(d => Number(d.id) === form.deptId);
  const selectedDeptLabel = selectedDept ? `${'· '.repeat(selectedDept._depth)}${selectedDept.label}` : '请选择部门';

  return (
    <View className="user-form-container">
      <View className="form-section">
        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">基本信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            <Picker
              mode="selector"
              range={deptOptions.map(d => `${'· '.repeat(d._depth)}${d.label}`)}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setForm(prev => ({ ...prev, deptId: Number(deptOptions[index].id) }));
              }}
            >
              <View className="at-input picker-input-aligned">
                <View className="at-input__container">
                  <View className="at-input__title">所属部门</View>
                  <View className="at-input__input picker-value-container">
                    <Text className={`picker-value ${!selectedDept ? 'placeholder' : ''}`}>
                      {selectedDeptLabel}
                    </Text>
                    <View className="at-icon at-icon-chevron-right picker-arrow"></View>
                  </View>
                </View>
              </View>
            </Picker>

            <AtInput
              name="userName"
              title="登录账号"
              placeholder="请输入登录账号"
              value={form.userName || ''}
              onChange={(v) => { setForm(p => ({ ...p, userName: String(v) })); return v; }}
            />
            <AtInput
              name="nickName"
              title="用户昵称"
              placeholder="请输入用户昵称"
              value={form.nickName || ''}
              onChange={(v) => { setForm(p => ({ ...p, nickName: String(v) })); return v; }}
            />
            {!userId && (
              <AtInput
                name="password"
                title="初始密码"
                type="password"
                placeholder="请输入初始密码"
                value={form.password || ''}
                onChange={(v) => { setForm(p => ({ ...p, password: String(v) })); return v; }}
              />
            )}
            <AtInput
              name="phonenumber"
              title="手机号码"
              type="phone"
              placeholder="请输入手机号码"
              value={form.phonenumber || ''}
              onChange={(v) => { setForm(p => ({ ...p, phonenumber: String(v) })); return v; }}
            />
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">用户属性</Text>
          </View>
          <View className="card-content">
            <View className="form-item-vertical">
              <Text className="item-label">性别</Text>
              <View className="radio-options-horizontal">
                {sexOptions.map((item) => (
                  <View
                    key={item.value}
                    className={`radio-option-item ${form.sex === item.value ? 'active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, sex: item.value }))}
                  >
                    <View className="radio-circle">
                      {form.sex === item.value && <View className="radio-inner" />}
                    </View>
                    <Text className="radio-label">{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="form-item-vertical" style={{ marginTop: '32rpx' }}>
              <Text className="item-label">状态</Text>
              <View className="radio-options-horizontal">
                {statusOptions.map((item) => (
                  <View
                    key={item.value}
                    className={`radio-option-item ${form.status === item.value ? 'active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, status: item.value }))}
                  >
                    <View className="radio-circle">
                      {form.status === item.value && <View className="radio-inner" />}
                    </View>
                    <Text className="radio-label">{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">分配角色</Text>
          </View>
          <View className="card-content">
            <View className="checkbox-group-vertical">
              {roleOptions.map((item) => {
                const isSelected = (form.roleIds || []).includes(String(item.roleId));
                return (
                  <View
                    key={String(item.roleId)}
                    className={`checkbox-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      const nextIds = isSelected
                        ? (form.roleIds || []).filter(id => id !== String(item.roleId))
                        : [...(form.roleIds || []), String(item.roleId)];
                      setForm(prev => ({ ...prev, roleIds: nextIds }));
                    }}
                  >
                    <View className={`checkbox-box ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <View className="checkbox-inner" />}
                    </View>
                    <Text className="checkbox-label">{item.roleName}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <View className="action-section">
        <AtButton className="save-btn" type="primary" loading={submitting} onClick={() => void handleSave()}>
          保存用户
        </AtButton>
        <AtButton className="cancel-btn" onClick={() => Taro.navigateBack()}>
          返回
        </AtButton>
      </View>
    </View>
  );
}
