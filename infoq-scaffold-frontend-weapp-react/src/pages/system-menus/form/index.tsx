import { View, Text, Picker } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import {
  addMenu,
  getDicts,
  getMenu,
  menuTreeSelect,
  flattenTree,
  toDictOptions,
  updateMenu,
  type DictOption,
  type MenuForm,
  type MenuType,
  type DeptTreeVO,
  type FlatTreeItem
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtButton, AtInput, AtTextarea } from 'taro-ui';
import { handlePageError, showSuccess } from '../../../utils/ui';
import { useSessionStore } from '../../../store/session';
import { routes } from '../../../utils/navigation';
import './index.scss';

const menuTypeOptions = [
  { label: '目录', value: 'M' as const },
  { label: '菜单', value: 'C' as const },
  { label: '按钮', value: 'F' as const }
];

const visibleOptions = [
  { label: '显示', value: '0' },
  { label: '隐藏', value: '1' }
];

const createForm = (): MenuForm => ({
  parentId: 0,
  menuId: undefined,
  menuName: '',
  orderNum: 1,
  path: '',
  component: '',
  menuType: 'M',
  visible: '0',
  status: '0',
  perms: '',
  icon: '',
  remark: ''
});

export default function MenuFormPage() {
  const router = useRouter();
  const menuId = router.params.menuId;
  const parentIdFromUrl = router.params.parentId;
  const loadSession = useSessionStore((state) => state.loadSession);
  const [form, setForm] = useState<MenuForm>(createForm());
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [treeOptions, setTreeOptions] = useState<Array<FlatTreeItem<DeptTreeVO>>>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }

      const [statusRes, treeRes] = await Promise.all([
        getDicts('sys_normal_disable'),
        menuTreeSelect()
      ]);
      setStatusOptions(toDictOptions(statusRes.data));
      setTreeOptions(flattenTree(treeRes.data || []));

      if (menuId) {
        const response = await getMenu(menuId);
        const data = response.data;
        setForm({
          parentId: data.parentId,
          menuId: data.menuId,
          menuName: data.menuName,
          orderNum: data.orderNum,
          path: data.path || '',
          component: data.component || '',
          menuType: data.menuType,
          visible: data.visible || '0',
          status: data.status || '0',
          perms: data.perms || '',
          icon: data.icon || '',
          remark: data.remark || ''
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
    if (!form.menuName.trim()) {
      await Taro.showToast({ title: '请输入菜单名称', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      if (menuId) {
        await updateMenu(form);
      } else {
        await addMenu(form);
      }
      await showSuccess(menuId ? '菜单已更新' : '菜单已创建');
      Taro.navigateBack();
    } catch (error) {
      await handlePageError(error, '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const parentMenuOptions = [
    { label: '顶级菜单', id: 0, _depth: 0 },
    ...treeOptions.filter(m => String(m.id) !== String(menuId))
  ];
  
  const selectedParent = parentMenuOptions.find(m => String(m.id) === String(form.parentId));
  const selectedParentLabel = selectedParent ? `${'· '.repeat(selectedParent._depth)}${selectedParent.label}` : '请选择上级菜单';

  const selectedType = menuTypeOptions.find(t => t.value === form.menuType);

  return (
    <View className="menu-form-container">
      <View className="form-section">
        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">基本信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            <Picker
              mode="selector"
              range={parentMenuOptions.map(m => `${'· '.repeat(m._depth)}${m.label}`)}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setForm(prev => ({ ...prev, parentId: parentMenuOptions[index].id }));
              }}
            >
              <View className="at-input picker-input-aligned">
                <View className="at-input__container">
                  <View className="at-input__title">上级菜单</View>
                  <View className="at-input__input picker-value-container">
                    <Text className={`picker-value ${!selectedParent ? 'placeholder' : ''}`}>
                      {selectedParentLabel}
                    </Text>
                    <View className="at-icon at-icon-chevron-right picker-arrow"></View>
                  </View>
                </View>
              </View>
            </Picker>

            <Picker
              mode="selector"
              range={menuTypeOptions.map(t => t.label)}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setForm(prev => ({ ...prev, menuType: menuTypeOptions[index].value as MenuType }));
              }}
            >
              <View className="at-input picker-input-aligned">
                <View className="at-input__container">
                  <View className="at-input__title">菜单类型</View>
                  <View className="at-input__input picker-value-container">
                    <Text className="picker-value">
                      {selectedType?.label || '选择类型'}
                    </Text>
                    <View className="at-icon at-icon-chevron-right picker-arrow"></View>
                  </View>
                </View>
              </View>
            </Picker>

            <AtInput
              name="menuName"
              title="菜单名称"
              placeholder="请输入菜单名称"
              value={form.menuName}
              onChange={(v) => { setForm(p => ({ ...p, menuName: String(v) })); return v; }}
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
            <Text className="card-title">配置信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            {form.menuType !== 'F' && (
              <AtInput
                name="path"
                title="路由地址"
                placeholder="请输入路由地址"
                value={form.path || ''}
                onChange={(v) => { setForm(p => ({ ...p, path: String(v) })); return v; }}
              />
            )}
            <AtInput
              name="perms"
              title="权限标识"
              placeholder="请输入权限标识"
              value={form.perms || ''}
              onChange={(v) => { setForm(p => ({ ...p, perms: String(v) })); return v; }}
            />
            <AtInput
              name="icon"
              title="菜单图标"
              placeholder="请输入图标名称"
              value={form.icon || ''}
              onChange={(v) => { setForm(p => ({ ...p, icon: String(v) })); return v; }}
            />
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">状态控制</Text>
          </View>
          <View className="card-content">
            <View className="form-item-vertical">
              <Text className="item-label">显示状态</Text>
              <View className="radio-options-horizontal">
                {visibleOptions.map((item) => (
                  <View
                    key={item.value}
                    className={`radio-option-item ${form.visible === item.value ? 'active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, visible: item.value }))}
                  >
                    <View className="radio-circle">
                      {form.visible === item.value && <View className="radio-inner" />}
                    </View>
                    <Text className="radio-label">{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="form-item-vertical" style={{ marginTop: '32rpx' }}>
              <Text className="item-label">菜单状态</Text>
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
            <Text className="card-title">备注</Text>
          </View>
          <View className="card-content">
            <AtTextarea
              height={150}
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
          保存菜单
        </AtButton>
        <AtButton className="cancel-btn" onClick={() => Taro.navigateBack()}>
          返回
        </AtButton>
      </View>
    </View>
  );
}
