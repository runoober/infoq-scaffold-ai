import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import {
  addRole,
  getDicts,
  getRole,
  toDictOptions,
  updateRole,
  type DictOption,
  type RoleForm
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtButton, AtInput, AtTextarea } from 'taro-ui';
import { handlePageError, showSuccess } from '../../../utils/ui';
import { useSessionStore } from '../../../store/session';
import { routes } from '../../../utils/navigation';
import './index.scss';

const createForm = (): RoleForm => ({
  roleId: undefined,
  roleName: '',
  roleKey: '',
  roleSort: 1,
  status: '0',
  remark: ''
});

export default function RoleFormPage() {
  const router = useRouter();
  const roleId = router.params.roleId;
  const loadSession = useSessionStore((state) => state.loadSession);
  const [form, setForm] = useState<RoleForm>(createForm());
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }

      const statusRes = await getDicts('sys_normal_disable');
      setStatusOptions(toDictOptions(statusRes.data));

      if (roleId) {
        const response = await getRole(roleId);
        const data = response.data;
        setForm({
          roleId: data.roleId,
          roleName: data.roleName,
          roleKey: data.roleKey,
          roleSort: data.roleSort,
          status: data.status || '0',
          remark: data.remark || ''
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
    if (!form.roleName.trim()) {
      await Taro.showToast({ title: '请输入角色名称', icon: 'none' });
      return;
    }
    if (!form.roleKey.trim()) {
      await Taro.showToast({ title: '请输入权限字符', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      if (roleId) {
        await updateRole(form);
      } else {
        await addRole(form);
      }
      await showSuccess(roleId ? '角色已更新' : '角色已创建');
      Taro.navigateBack();
    } catch (error) {
      await handlePageError(error, '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="role-form-container">
      <View className="form-section">
        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">基本信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            <AtInput
              name="roleName"
              title="角色名称"
              placeholder="请输入角色名称"
              value={form.roleName}
              onChange={(v) => { setForm(p => ({ ...p, roleName: String(v) })); return v; }}
            />
            <AtInput
              name="roleKey"
              title="权限字符"
              placeholder="请输入权限字符"
              value={form.roleKey}
              onChange={(v) => { setForm(p => ({ ...p, roleKey: String(v) })); return v; }}
            />
            <AtInput
              name="roleSort"
              title="显示顺序"
              type="number"
              placeholder="请输入显示顺序"
              value={String(form.roleSort)}
              onChange={(v) => { setForm(p => ({ ...p, roleSort: Number(v) })); return v; }}
            />
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">状态</Text>
          </View>
          <View className="card-content">
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

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">备注</Text>
          </View>
          <View className="card-content">
            <AtTextarea
              height={200}
              count={false}
              placeholder="请输入备注说明"
              value={form.remark || ''}
              onChange={(value) => setForm((prev) => ({ ...prev, remark: value }))}
            />
          </View>
        </View>
      </View>

      <View className="action-section">
        <AtButton className="save-btn" type="primary" loading={submitting} onClick={() => void handleSave()}>
          保存角色
        </AtButton>
        <AtButton className="cancel-btn" onClick={() => Taro.navigateBack()}>
          返回
        </AtButton>
      </View>
    </View>
  );
}
