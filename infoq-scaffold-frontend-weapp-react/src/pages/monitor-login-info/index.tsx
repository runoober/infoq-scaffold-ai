import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  cleanLoginInfo,
  delLoginInfo,
  getDictLabel,
  getDicts,
  listLoginInfo,
  toDictOptions,
  unlockLoginInfo,
  type DictOption,
  type LoginInfoQuery,
  type LoginInfoVO
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtButton, AtInput } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard, StatusTag, FabButton } from '../../components/taro-ui-kit';
import { routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (pageNum = 1): LoginInfoQuery => ({
  pageNum,
  pageSize: 10,
  ipaddr: '',
  userName: '',
  status: '',
  orderByColumn: 'loginTime',
  isAsc: 'descending'
});

export default function MonitorLoginInfoPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<LoginInfoQuery>(createQuery());
  const [list, setList] = useState<LoginInfoVO[]>([]);
  const [total, setTotal] = useState(0);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);

  const canList = permissions.includes('monitor:loginInfo:list');
  const canRemove = permissions.includes('monitor:loginInfo:remove');
  const canUnlock = permissions.includes('monitor:loginInfo:unlock');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [statusResponse, listResponse] = await Promise.all([
        getDicts('sys_common_status'),
        canList ? listLoginInfo(nextQuery) : Promise.resolve({ rows: [], total: 0 })
      ]);
      setStatusOptions(toDictOptions(statusResponse.data));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '登录日志加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const handleDelete = async (infoId: string | number) => {
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除日志 #${infoId} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await delLoginInfo(infoId);
      await showSuccess('日志已删除');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '日志删除失败');
    }
  };

  const handleUnlock = async (userName: string) => {
    try {
      await unlockLoginInfo(userName);
      await showSuccess('账号已解锁');
    } catch (error) {
      await handlePageError(error, '账号解锁失败');
    }
  };

  const handleClean = async () => {
    const modal = await Taro.showModal({
      title: '确认清空',
      content: '确定清空所有登录日志吗？'
    });
    if (!modal.confirm) return;
    try {
      await cleanLoginInfo();
      await showSuccess('登录日志已清空');
      await loadPage({ ...query, pageNum: 1 });
    } catch (error) {
      await handlePageError(error, '登录日志清空失败');
    }
  };

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="userName"
            placeholder="按用户名称过滤"
            title="用户名称"
            value={query.userName || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, userName: String(value) }));
              return value;
            }}
          />
          <AtInput
            clear
            name="ipaddr"
            placeholder="按登录地址过滤"
            title="登录地址"
            value={query.ipaddr || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, ipaddr: String(value) }));
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
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关日志" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.infoId)}
            icon="file-generic"
            title={item.userName || '未知用户'}
            statusColor={item.status === '0' ? '#52c41a' : '#ff4d4f'}
            extra={
              <StatusTag 
                label={getDictLabel(statusOptions, item.status) || '未知'} 
                type={item.status === '0' ? 'success' : 'error'} 
              />
            }
            actions={[
              ...(canUnlock ? [{ onClick: () => void handleUnlock(item.userName), title: '解锁' }] : []),
              ...(canRemove ? [{ onClick: () => void handleDelete(item.infoId), title: '删除', danger: true }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '登录地址', value: item.ipaddr || '-' },
                { label: '浏览器', value: item.browser || '-' },
                { label: '操作系统', value: item.os || '-' },
                { label: '结果信息', value: item.msg || '-' },
                { label: '登录时间', value: item.loginTime ? String(item.loginTime) : '-' }
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

      {canRemove && <FabButton icon="trash" onClick={() => void handleClean()} />}
      
      <BottomNav active="admin" />
    </View>
  );
}
