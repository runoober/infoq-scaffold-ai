import { View, Text, Picker } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import {
  addDept,
  getDicts,
  getDept,
  listDept,
  toDictOptions,
  updateDept,
  flattenTree,
  type DictOption,
  type DeptForm,
  type DeptVO,
  type FlatTreeItem
} from '@/api';
import { useState } from 'react';
import { AtButton, AtInput } from 'taro-ui';
import { handlePageError, showSuccess } from '../../../utils/ui';
import { useSessionStore } from '../../../store/session';
import { routes } from '../../../utils/navigation';
import './index.scss';

const createForm = (): DeptForm => ({
  parentId: 0,
  deptId: undefined,
  deptName: '',
  deptCategory: '',
  orderNum: 1,
  phone: '',
  email: '',
  status: '0'
});

type DeptParentOption = {
  id: string | number;
  label: string;
  _depth: number;
};

export default function DeptFormPage() {
  const router = useRouter();
  const deptId = router.params.deptId;
  const parentIdFromUrl = router.params.parentId;
  const loadSession = useSessionStore((state) => state.loadSession);
  const [form, setForm] = useState<DeptForm>(createForm());
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [treeOptions, setTreeOptions] = useState<Array<FlatTreeItem<DeptVO>>>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }

      const [statusRes, listRes] = await Promise.all([
        getDicts('sys_normal_disable'),
        listDept({ pageNum: 1, pageSize: 100, deptName: '', deptCategory: '', status: '' })
      ]);
      setStatusOptions(toDictOptions(statusRes.data));
      setTreeOptions(flattenTree(listRes.data || []));

      if (deptId) {
        const response = await getDept(deptId);
        const data = response.data;
        setForm({
          deptId: data.deptId,
          parentId: data.parentId,
          deptName: data.deptName,
          deptCategory: data.deptCategory || '',
          orderNum: data.orderNum,
          phone: data.phone || '',
          email: data.email || '',
          status: data.status || '0'
        });
      } else if (parentIdFromUrl) {
        setForm(prev => ({ ...prev, parentId: Number(parentIdFromUrl) }));
      }
    } catch (error) {
      await handlePageError(error, '加载失败');
    }
  };

  useDidShow(() => {
    void loadData();
  });

  const handleSave = async () => {
    if (!form.deptName?.trim()) {
      await Taro.showToast({ title: '请输入部门名称', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      if (deptId) {
        await updateDept(form);
      } else {
        await addDept(form);
      }
      await showSuccess(deptId ? '部门已更新' : '部门已创建');
      Taro.navigateBack();
    } catch (error) {
      await handlePageError(error, '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const parentDeptOptions: DeptParentOption[] = [
    { label: '顶级部门', id: 0, _depth: 0 },
    ...treeOptions
      .filter((item) => String(item.deptId) !== String(deptId))
      .map((item) => ({
        id: item.deptId,
        label: item.deptName,
        _depth: item._depth
      }))
  ];

  const selectedParent = parentDeptOptions.find(d => String(d.id) === String(form.parentId));
  const selectedParentLabel = selectedParent ? `${'· '.repeat(selectedParent._depth)}${selectedParent.label}` : '请选择上级部门';

  return (
    <View className="dept-form-container">
      <View className="form-section">
        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">基本信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            <Picker
              mode="selector"
              range={parentDeptOptions.map((item) => `${'· '.repeat(item._depth)}${item.label}`)}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setForm((prev) => ({ ...prev, parentId: parentDeptOptions[index]?.id ?? 0 }));
              }}
            >
              <View className="at-input picker-input-aligned">
                <View className="at-input__container">
                  <View className="at-input__title">上级部门</View>
                  <View className="at-input__input picker-value-container">
                    <Text className={`picker-value ${!selectedParent ? 'placeholder' : ''}`}>
                      {selectedParentLabel}
                    </Text>
                    <View className="at-icon at-icon-chevron-right picker-arrow"></View>
                  </View>
                </View>
              </View>
            </Picker>

            <AtInput
              name="deptName"
              title="部门名称"
              placeholder="请输入部门名称"
              value={form.deptName || ''}
              onChange={(v) => { setForm(p => ({ ...p, deptName: String(v) })); return v; }}
            />
            <AtInput
              name="deptCategory"
              title="部门类别"
              placeholder="请输入部门类别"
              value={form.deptCategory || ''}
              onChange={(v) => { setForm(p => ({ ...p, deptCategory: String(v) })); return v; }}
            />
            <AtInput
              name="orderNum"
              title="显示顺序"
              type="number"
              placeholder="请输入显示顺序"
              value={String(form.orderNum || 1)}
              onChange={(v) => { setForm(p => ({ ...p, orderNum: Number(v || 1) })); return v; }}
            />
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">联系信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            <AtInput
              name="phone"
              title="联系电话"
              type="phone"
              placeholder="请输入联系电话"
              value={form.phone || ''}
              onChange={(v) => { setForm(p => ({ ...p, phone: String(v) })); return v; }}
            />
            <AtInput
              name="email"
              title="邮箱地址"
              placeholder="请输入邮箱地址"
              value={form.email || ''}
              onChange={(v) => { setForm(p => ({ ...p, email: String(v) })); return v; }}
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
      </View>

      <View className="action-section">
        <AtButton className="save-btn" type="primary" loading={submitting} onClick={() => void handleSave()}>
          保存部门
        </AtButton>
        <AtButton className="cancel-btn" onClick={() => Taro.navigateBack()}>
          返回
        </AtButton>
      </View>
    </View>
  );
}
