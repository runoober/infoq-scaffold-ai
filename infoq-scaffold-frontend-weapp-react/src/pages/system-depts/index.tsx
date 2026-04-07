import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  delDept,
  flattenTree,
  getDictLabel,
  getDicts,
  listDept,
  toDictOptions,
  type DeptQuery,
  type DeptVO,
  type DictOption,
  type FlatTreeItem
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtInput, AtButton } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, RecordCard, StatusTag, FabButton } from '../../components/taro-ui-kit';
import { navigate, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (): DeptQuery => ({
  pageNum: 1,
  pageSize: 100,
  deptName: '',
  deptCategory: '',
  status: ''
});

export default function SystemDeptsPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<DeptQuery>(createQuery());
  const [list, setList] = useState<Array<FlatTreeItem<DeptVO>>>([]);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);

  const canList = permissions.includes('system:dept:list');
  const canAdd = permissions.includes('system:dept:add');
  const canEdit = permissions.includes('system:dept:edit');
  const canRemove = permissions.includes('system:dept:remove');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [statusResponse, listResponse] = await Promise.all([
        getDicts('sys_normal_disable'),
        canList ? listDept(nextQuery) : Promise.resolve({ data: [] as DeptVO[] })
      ]);
      setStatusOptions(toDictOptions(statusResponse.data));
      setList(flattenTree(listResponse.data || []));
    } catch (error) {
      await handlePageError(error, '部门列表加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const openCreate = (parentId?: string | number) => {
    navigate(`${routes.deptForm}${parentId !== undefined ? `?parentId=${parentId}` : ''}`);
  };

  const openEdit = (deptId: string | number) => {
    navigate(`${routes.deptForm}?deptId=${deptId}`);
  };

  const handleDelete = async (deptId: string | number) => {
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除部门 #${deptId} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await delDept(deptId);
      await showSuccess('部门已删除');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '部门删除失败');
    }
  };

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="deptName"
            placeholder="按部门名称过滤"
            title="部门名称"
            value={query.deptName || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, deptName: String(value) }));
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
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关部门" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.deptId)}
            icon="folder"
            title={`${'· '.repeat(item._depth)}${item.deptName}`}
            statusColor={item.status === '0' ? '#52c41a' : '#ff4d4f'}
            extra={
              <StatusTag 
                label={getDictLabel(statusOptions, item.status) || '未知'} 
                type={item.status === '0' ? 'success' : 'error'} 
              />
            }
            actions={[
              ...(canAdd ? [{ onClick: () => openCreate(item.deptId), title: '新增下级' }] : []),
              ...(canEdit ? [{ onClick: () => void openEdit(item.deptId), title: '编辑' }] : []),
              ...(canRemove ? [{ 
                onClick: () => void handleDelete(item.deptId), 
                title: '删除',
                danger: true 
              }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '上级部门', value: item.parentName || '顶级部门' },
                { label: '部门类别', value: item.deptCategory || '-' },
                { label: '联系方式', value: item.phone || item.email || '-' }
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
