import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  changeUserStatus,
  delUser,
  getDictLabel,
  getDicts,
  listUser,
  toDictOptions,
  type DictOption,
  type UserQuery,
  type UserVO
} from '@/api';
import { useState } from 'react';
import { AtInput, AtButton } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard, StatusTag, FabButton } from '../../components/taro-ui-kit';
import { navigate, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (pageNum = 1): UserQuery => ({
  pageNum,
  pageSize: 10,
  userName: '',
  nickName: '',
  phonenumber: '',
  status: ''
});

export default function SystemUsersPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<UserQuery>(createQuery());
  const [list, setList] = useState<UserVO[]>([]);
  const [total, setTotal] = useState(0);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);

  const canList = permissions.includes('system:user:list');
  const canAdd = permissions.includes('system:user:add');
  const canEdit = permissions.includes('system:user:edit');
  const canRemove = permissions.includes('system:user:remove');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [statusResponse, listResponse] = await Promise.all([
        getDicts('sys_normal_disable'),
        canList ? listUser(nextQuery) : Promise.resolve({ rows: [] as UserVO[], total: 0 })
      ]);
      setStatusOptions(toDictOptions(statusResponse.data));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '用户列表加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const openCreate = () => {
    navigate(routes.userForm);
  };

  const openEdit = (userId: string | number) => {
    navigate(`${routes.userForm}?userId=${userId}`);
  };

  const handleDelete = async (userId: string | number) => {
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除用户 #${userId} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await delUser(userId);
      await showSuccess('用户已删除');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '用户删除失败');
    }
  };

  const handleToggleStatus = async (item: UserVO) => {
    try {
      await changeUserStatus(String(item.userId), item.status === '0' ? '1' : '0');
      await showSuccess(item.status === '0' ? '用户已停用' : '用户已启用');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '用户状态更新失败');
    }
  };

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="userName"
            placeholder="按登录账号过滤"
            title="登录账号"
            value={query.userName || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, userName: String(value) }));
              return value;
            }}
          />
          <AtInput
            clear
            name="nickName"
            placeholder="按用户昵称过滤"
            title="用户昵称"
            value={query.nickName || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, nickName: String(value) }));
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
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关用户" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.userId)}
            icon="user"
            title={item.nickName || item.userName || '未知用户'}
            statusColor={item.status === '0' ? '#52c41a' : '#ff4d4f'}
            extra={
              <StatusTag 
                label={getDictLabel(statusOptions, item.status) || '未知'} 
                type={item.status === '0' ? 'success' : 'error'} 
              />
            }
            actions={[
              ...(canEdit ? [{ onClick: () => void openEdit(String(item.userId)), title: '编辑' }] : []),
              ...(canEdit && !item.admin ? [{ 
                onClick: () => void handleToggleStatus(item), 
                title: item.status === '0' ? '停用' : '启用',
                danger: item.status === '0'
              }] : []),
              ...(canRemove && !item.admin ? [{ 
                onClick: () => void handleDelete(String(item.userId)), 
                title: '删除',
                danger: true 
              }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '登录账号', value: item.userName || '-' },
                { label: '所属部门', value: item.deptName || '-' },
                { label: '手机号码', value: item.phonenumber || '-' },
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

      {canAdd && <FabButton onClick={() => openCreate()} />}
      
      <BottomNav active="admin" />
    </View>
  );
}
