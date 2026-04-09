import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  delMenu,
  flattenTree,
  getDictLabel,
  getDicts,
  listMenu,
  toDictOptions,
  type DictOption,
  type FlatTreeItem,
  type MenuQuery,
  type MenuVO
} from '@/api';
import { useState } from 'react';
import { AtInput, AtButton } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, RecordCard, StatusTag, FabButton } from '../../components/taro-ui-kit';
import { navigate, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const menuTypeOptions = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' }
];

const createQuery = (): MenuQuery => ({
  menuName: '',
  status: ''
});

export default function SystemMenusPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<MenuQuery>(createQuery());
  const [list, setList] = useState<Array<FlatTreeItem<MenuVO>>>([]);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);

  const canList = permissions.includes('system:menu:list');
  const canAdd = permissions.includes('system:menu:add');
  const canEdit = permissions.includes('system:menu:edit');
  const canRemove = permissions.includes('system:menu:remove');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [statusResponse, listResponse] = await Promise.all([
        getDicts('sys_normal_disable'),
        canList ? listMenu(nextQuery) : Promise.resolve({ data: [] as MenuVO[] })
      ]);
      setStatusOptions(toDictOptions(statusResponse.data));
      setList(flattenTree(listResponse.data || []));
    } catch (error) {
      await handlePageError(error, '菜单列表加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const openCreate = (parentId?: string | number) => {
    navigate(`${routes.menuForm}${parentId !== undefined ? `?parentId=${parentId}` : ''}`);
  };

  const openEdit = (menuId: string | number) => {
    navigate(`${routes.menuForm}?menuId=${menuId}`);
  };

  const handleDelete = async (menuId: string | number) => {
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除菜单 #${menuId} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await delMenu(menuId);
      await showSuccess('菜单已删除');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '菜单删除失败');
    }
  };

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="menuName"
            placeholder="按菜单名称过滤"
            title="菜单名称"
            value={query.menuName || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, menuName: String(value) }));
              return value;
            }}
          />
          <View className="search-actions">
            <AtButton
              className="search-action-btn"
              type="secondary"
              onClick={() => {
                const nextQuery = createQuery();
                setQuery(nextQuery);
                void loadPage(nextQuery);
              }}
            >
              重置
            </AtButton>
            <AtButton
              className="search-action-btn"
              type="primary"
              onClick={() => void loadPage({ ...query })}
            >
              查询
            </AtButton>
          </View>
        </View>
      </View>

      <View className="list-content">
        {!canList && <EmptyNotice message="当前账号没有访问权限" />}
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关菜单" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.menuId)}
            icon="menu"
            title={`${'· '.repeat(item._depth)}${item.menuName}`}
            statusColor={item.status === '0' ? '#52c41a' : '#ff4d4f'}
            extra={
              <StatusTag 
                label={menuTypeOptions.find(o => o.value === item.menuType)?.label || '未知'} 
                type={item.menuType === 'M' ? 'info' : item.menuType === 'C' ? 'success' : 'warning'} 
              />
            }
            actions={[
              ...(canAdd ? [{ onClick: () => openCreate(item.menuId), title: '新增下级' }] : []),
              ...(canEdit ? [{ onClick: () => void openEdit(item.menuId), title: '编辑' }] : []),
              ...(canRemove ? [{ 
                onClick: () => void handleDelete(item.menuId), 
                title: '删除',
                danger: true 
              }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '权限标识', value: item.perms || '-' },
                { label: '路由地址', value: item.path || '-' },
                { label: '状态', value: <StatusTag label={getDictLabel(statusOptions, item.status) || '正常'} type={item.status === '0' ? 'success' : 'error'} /> }
              ]}
            />
          </RecordCard>
        ))}
      </View>

      {canAdd && <FabButton onClick={() => openCreate()} />}
      
      <BottomNav active="admin" />
    </View>
  );
}
