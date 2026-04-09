import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getCache, type CacheVO } from '@/api';
import { useState } from 'react';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, RecordCard, StatusTag } from '../../components/taro-ui-kit';
import { routes } from '../../utils/navigation';
import { handlePageError } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

export default function MonitorCachePage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [cache, setCache] = useState<CacheVO | null>(null);

  const canList = permissions.includes('monitor:cache:list');

  useDidShow(() => {
    const run = async () => {
      try {
        const session = await loadSession();
        if (!session) {
          Taro.reLaunch({ url: routes.login });
          return;
        }
        if (!canList) {
          setCache(null);
          return;
        }
        const response = await getCache();
        setCache(response.data);
      } catch (error) {
        await handlePageError(error, '缓存概览加载失败');
      }
    };
    void run();
  });

  const info = cache?.info || {};

  return (
    <View className="list-container">
      <View className="admin-header" style={{ background: '#1677ff', padding: '40rpx 32rpx', color: '#fff' }}>
        <Text style={{ fontSize: '36rpx', fontWeight: 'bold' }}>缓存监控</Text>
        <Text style={{ fontSize: '24rpx', opacity: 0.8, display: 'block', marginTop: '8rpx' }}>Redis 实时运行指标</Text>
      </View>

      <View className="list-content" style={{ marginTop: '-20rpx' }}>
        {!canList && <EmptyNotice message="当前账号没有访问权限" />}
        {canList && !cache && <EmptyNotice message="暂无缓存数据" />}
        
        {canList && cache && (
          <>
            <RecordCard icon="settings" title="基础信息" extra={<StatusTag label="运行中" type="success" />}>
              <KeyValueList
                items={[
                  { label: 'Redis 版本', value: info.redis_version || '-' },
                  { label: '运行模式', value: info.redis_mode === 'standalone' ? '单机' : info.redis_mode || '-' },
                  { label: 'TCP 端口', value: info.tcp_port || '-' },
                  { label: '运行天数', value: `${info.uptime_in_days || '0'} 天` },
                  { label: '已用内存', value: info.used_memory_human || '-' },
                  { label: '内存峰值', value: info.used_memory_peak_human || '-' }
                ]}
              />
            </RecordCard>

            <RecordCard icon="eye" title="性能指标">
              <KeyValueList
                items={[
                  { label: '客户端连接', value: info.connected_clients || '0' },
                  { label: '命中次数', value: info.keyspace_hits || '0' },
                  { label: '未命中次数', value: info.keyspace_misses || '0' },
                  { label: '过期键数', value: info.expired_keys || '0' },
                  { label: '驱逐键数', value: info.evicted_keys || '0' },
                  { label: '网络吞吐', value: `${info.instantaneous_input_kbps || '0'} kbps / ${info.instantaneous_output_kbps || '0'} kbps` }
                ]}
              />
            </RecordCard>

            <RecordCard icon="list" title="命令统计" className="command-stats-card">
              <KeyValueList
                items={(cache.commandStats || []).map(item => ({
                  label: item.name,
                  value: `${item.value} 次`
                }))}
              />
            </RecordCard>
          </>
        )}
      </View>

      <BottomNav active="admin" />
    </View>
  );
}
