import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  delNotice,
  formatDateTime,
  getDictLabel,
  getDicts,
  listNotice,
  stripHtml,
  toDictOptions,
  type DictOption,
  type NoticeQuery,
  type NoticeVO
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtButton, AtInput } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard, StatusTag, FabButton } from '../../components/taro-ui-kit';
import { navigate, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (pageNum = 1): NoticeQuery => ({
  pageNum,
  pageSize: 10,
  noticeTitle: '',
  createByName: '',
  status: '',
  noticeType: ''
});

export default function NoticesPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<NoticeQuery>(createQuery());
  const [list, setList] = useState<NoticeVO[]>([]);
  const [total, setTotal] = useState(0);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<DictOption[]>([]);

  const canList = permissions.includes('system:notice:list');
  const canQuery = permissions.includes('system:notice:query');
  const canEdit = permissions.includes('system:notice:edit');
  const canAdd = permissions.includes('system:notice:add');
  const canRemove = permissions.includes('system:notice:remove');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [statusResponse, typeResponse, listResponse] = await Promise.all([
        getDicts('sys_notice_status'),
        getDicts('sys_notice_type'),
        canList ? listNotice(nextQuery) : Promise.resolve({ rows: [], total: 0 })
      ]);
      setStatusOptions(toDictOptions(statusResponse.data));
      setTypeOptions(toDictOptions(typeResponse.data));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '公告列表加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const handleDelete = async (noticeId: number) => {
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除公告 #${noticeId} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await delNotice(noticeId);
      await showSuccess('删除成功');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '公告删除失败');
    }
  };

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="noticeTitle"
            placeholder="按公告标题过滤"
            title="搜索标题"
            value={query.noticeTitle || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, noticeTitle: String(value) }));
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
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关公告" />}
        {canList && list.map((item) => (
          <RecordCard
            key={item.noticeId}
            icon="message"
            title={item.noticeTitle}
            statusColor={item.noticeType === '1' ? '#1677ff' : '#faad14'}
            extra={
              <StatusTag 
                label={getDictLabel(typeOptions, item.noticeType) || '公告'} 
                type={item.noticeType === '1' ? 'info' : 'warning'} 
              />
            }
            actions={[
              ...(canQuery ? [{ onClick: () => navigate(`${routes.noticeDetail}?noticeId=${item.noticeId}`), title: '详情' }] : []),
              ...(canEdit ? [{ onClick: () => navigate(`${routes.noticeForm}?noticeId=${item.noticeId}`), title: '编辑' }] : []),
              ...(canRemove ? [{ 
                onClick: () => void handleDelete(item.noticeId), 
                title: '删除',
                danger: true 
              }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '状态', value: getDictLabel(statusOptions, item.status) || '-' },
                { label: '摘要', value: stripHtml(item.noticeContent).slice(0, 50) + (stripHtml(item.noticeContent).length > 50 ? '...' : '') || '-' },
                { label: '发布人', value: item.createByName || '系统' },
                { label: '发布时间', value: item.createTime ? formatDateTime(item.createTime).split(' ')[0] : '-' }
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

      {canAdd && <FabButton onClick={() => navigate(routes.noticeForm)} />}
      
      <BottomNav active="admin" />
    </View>
  );
}
