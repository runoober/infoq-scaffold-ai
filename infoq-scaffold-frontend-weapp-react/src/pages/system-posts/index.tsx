import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  delPost,
  getDictLabel,
  getDicts,
  listPost,
  toDictOptions,
  type DictOption,
  type PostQuery,
  type PostVO
} from '@/api';
import { useState } from 'react';
import { AtInput, AtButton } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard, StatusTag, FabButton } from '../../components/taro-ui-kit';
import { navigate, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (pageNum = 1): PostQuery => ({
  pageNum,
  pageSize: 10,
  deptId: '',
  belongDeptId: '',
  postCode: '',
  postName: '',
  postCategory: '',
  status: ''
});

export default function SystemPostsPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<PostQuery>(createQuery());
  const [list, setList] = useState<PostVO[]>([]);
  const [total, setTotal] = useState(0);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);

  const canList = permissions.includes('system:post:list');
  const canAdd = permissions.includes('system:post:add');
  const canEdit = permissions.includes('system:post:edit');
  const canRemove = permissions.includes('system:post:remove');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [statusResponse, listResponse] = await Promise.all([
        getDicts('sys_normal_disable'),
        canList ? listPost(nextQuery) : Promise.resolve({ rows: [], total: 0 })
      ]);
      setStatusOptions(toDictOptions(statusResponse.data));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '岗位列表加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const openCreate = () => {
    navigate(routes.postForm);
  };

  const openEdit = (postId: string | number) => {
    navigate(`${routes.postForm}?postId=${postId}`);
  };

  const handleDelete = async (postId: string | number) => {
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除岗位 #${postId} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await delPost(postId);
      await showSuccess('岗位已删除');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '岗位删除失败');
    }
  };

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="postName"
            placeholder="按岗位名称过滤"
            title="岗位名称"
            value={query.postName || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, postName: String(value) }));
              return value;
            }}
          />
          <AtInput
            clear
            name="postCode"
            placeholder="按岗位编码过滤"
            title="岗位编码"
            value={query.postCode || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, postCode: String(value) }));
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
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关岗位" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.postId)}
            icon="calendar"
            title={item.postName || '未知岗位'}
            statusColor={item.status === '0' ? '#52c41a' : '#ff4d4f'}
            extra={
              <StatusTag 
                label={getDictLabel(statusOptions, item.status) || '未知'} 
                type={item.status === '0' ? 'success' : 'error'} 
              />
            }
            actions={[
              ...(canEdit ? [{ onClick: () => void openEdit(item.postId), title: '编辑' }] : []),
              ...(canRemove ? [{ 
                onClick: () => void handleDelete(item.postId), 
                title: '删除',
                danger: true 
              }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '岗位编码', value: item.postCode || '-' },
                { label: '所属部门', value: item.deptName || '-' },
                { label: '岗位类别', value: item.postCategory || '-' },
                { label: '显示顺序', value: String(item.postSort) }
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
