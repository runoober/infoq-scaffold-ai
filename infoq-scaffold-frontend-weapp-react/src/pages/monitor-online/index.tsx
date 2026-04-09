import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { forceLogout, getDictLabel, getDicts, listOnlineUsers, toDictOptions, type DictOption, type OnlineQuery, type OnlineVO } from '@/api';
import { useState } from 'react';
import { AtButton, AtInput } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard, StatusTag } from '../../components/taro-ui-kit';
import { routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (pageNum = 1): OnlineQuery => ({
  pageNum,
  pageSize: 10,
  ipaddr: '',
  userName: ''
});

export default function MonitorOnlinePage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<OnlineQuery>(createQuery());
  const [list, setList] = useState<OnlineVO[]>([]);
  const [total, setTotal] = useState(0);
  const [deviceOptions, setDeviceOptions] = useState<DictOption[]>([]);

  const canList = permissions.includes('monitor:online:list');
  const canForce = permissions.includes('monitor:online:forceLogout');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [deviceResponse, listResponse] = await Promise.all([
        getDicts('sys_device_type'),
        canList ? listOnlineUsers(nextQuery) : Promise.resolve({ rows: [], total: 0 })
      ]);
      setDeviceOptions(toDictOptions(deviceResponse.data));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '在线用户加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const handleForceLogout = async (item: OnlineVO) => {
    const modal = await Taro.showModal({
      title: '确认强退',
      content: `确定强退用户 ${item.userName} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await forceLogout(item.tokenId);
      await showSuccess('设备已强退');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '强退失败');
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
        {canList && list.length === 0 && <EmptyNotice message="当前没有在线设备" />}
        {canList && list.map((item) => (
          <RecordCard
            key={item.tokenId}
            icon="eye"
            title={item.userName || '未知用户'}
            statusColor="#1677ff"
            extra={
              <StatusTag 
                label={getDictLabel(deviceOptions, item.deviceType) || '未知设备'} 
                type="info" 
              />
            }
            actions={[
              ...(canForce ? [{ onClick: () => void handleForceLogout(item), title: '强退', danger: true }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '所属部门', value: item.deptName || '-' },
                { label: '登录地址', value: item.ipaddr || '-' },
                { label: '浏览器', value: item.browser || '-' },
                { label: '操作系统', value: item.os || '-' },
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

      <BottomNav active="admin" />
    </View>
  );
}
