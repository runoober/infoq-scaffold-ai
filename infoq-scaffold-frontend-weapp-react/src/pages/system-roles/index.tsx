import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  changeRoleStatus,
  delRole,
  getDictLabel,
  getDicts,
  listRole,
  toDictOptions,
  type DictOption,
  type RoleQuery,
  type RoleVO
} from '@/api';
import { useState } from 'react';
import { AtInput, AtButton } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard, StatusTag, FabButton } from '../../components/taro-ui-kit';
import { navigate, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (pageNum = 1): RoleQuery => ({
  pageNum,
  pageSize: 10,
  roleName: '',
  roleKey: '',
  status: ''
});

export default function SystemRolesPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<RoleQuery>(createQuery());
  const [list, setList] = useState<RoleVO[]>([]);
  const [total, setTotal] = useState(0);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);

  const canList = permissions.includes('system:role:list');
  const canAdd = permissions.includes('system:role:add');
  const canEdit = permissions.includes('system:role:edit');
  const canRemove = permissions.includes('system:role:remove');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [statusResponse, listResponse] = await Promise.all([
        getDicts('sys_normal_disable'),
        canList ? listRole(nextQuery) : Promise.resolve({ rows: [] as RoleVO[], total: 0 })
      ]);
      setStatusOptions(toDictOptions(statusResponse.data));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '角色列表加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const openCreate = () => {
    navigate(routes.roleForm);
  };

  const openEdit = (roleId: string | number) => {
    navigate(`${routes.roleForm}?roleId=${roleId}`);
  };

  const handleDelete = async (roleId: string | number) => {
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除角色 #${roleId} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await delRole(roleId);
      await showSuccess('角色已删除');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '角色删除失败');
    }
  };

  const handleToggleStatus = async (item: RoleVO) => {
    try {
      await changeRoleStatus(item.roleId, item.status === '0' ? '1' : '0');
      await showSuccess(item.status === '0' ? '角色已停用' : '角色已启用');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '角色状态更新失败');
    }
  };

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="roleName"
            placeholder="按角色名称过滤"
            title="角色名称"
            value={query.roleName}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, roleName: String(value) }));
              return value;
            }}
          />
          <AtInput
            clear
            name="roleKey"
            placeholder="按权限字符过滤"
            title="权限字符"
            value={query.roleKey}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, roleKey: String(value) }));
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
              onClick={() => void loadPage({ ...query, pageNum: 1 })}
            >
              查询
            </AtButton>
          </View>
        </View>
      </View>

      <View className="list-content">
        {!canList && <EmptyNotice message="当前账号没有访问权限" />}
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关角色" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.roleId)}
            icon="bookmark"
            title={item.roleName}
            statusColor={item.status === '0' ? '#52c41a' : '#ff4d4f'}
            extra={
              <StatusTag 
                label={getDictLabel(statusOptions, item.status) || '未知'} 
                type={item.status === '0' ? 'success' : 'error'} 
              />
            }
            actions={[
              ...(canEdit ? [{ onClick: () => void openEdit(item.roleId), title: '编辑' }] : []),
              ...(canEdit && !item.admin ? [{ 
                onClick: () => void handleToggleStatus(item), 
                title: item.status === '0' ? '停用' : '启用',
                danger: item.status === '0'
              }] : []),
              ...(canRemove && !item.admin ? [{ 
                onClick: () => void handleDelete(item.roleId), 
                title: '删除',
                danger: true 
              }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '权限字符', value: item.roleKey },
                { label: '显示顺序', value: String(item.roleSort) },
                { label: '创建时间', value: item.createTime ? String(item.createTime).split(' ')[0] : '-' }
              ]}
            />
          </RecordCard>
        ))}

        {canList && (
          <PaginationBar
            current={query.pageNum}
            pageSize={query.pageSize}
            total={total}
            onChange={(page) => {
              const nextQuery = { ...query, pageNum: page };
              setQuery(nextQuery);
              void loadPage(nextQuery);
            }}
          />
        )}
      </View>

      {canAdd && <FabButton onClick={openCreate} />}
      
      <BottomNav active="admin" />
    </View>
  );
}
