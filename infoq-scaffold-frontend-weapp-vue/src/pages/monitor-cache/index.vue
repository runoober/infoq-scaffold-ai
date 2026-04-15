<template>
  <view class="list-container">

    <view class="list-content">
      <RecordCard icon="settings" title="基础信息">
        <template #extra>
          <StatusTag label="运行中" type="success" />
        </template>
        <KeyValueList
          :items="[
            { label: 'Redis版本', value: cache.info?.redis_version || '-' },
            { label: '运行模式', value: cache.info?.redis_mode === 'standalone' ? '单机' : '集群' },
            { label: '端口', value: cache.info?.tcp_port || '-' },
            { label: '客户端数', value: cache.info?.connected_clients || '-' },
            { label: '运行时间', value: cache.info?.uptime_in_days + '天' || '-' },
            { label: '使用内存', value: cache.info?.used_memory_human || '-' }
          ]"
        />
      </RecordCard>

      <RecordCard icon="eye" title="性能指标">
        <KeyValueList
          :items="[
            { label: '内存占用', value: cache.info?.used_memory_rss_human || '-' },
            { label: '网络入', value: cache.info?.instantaneous_input_kbps + 'kps' || '-' },
            { label: '网络出', value: cache.info?.instantaneous_output_kbps + 'kps' || '-' },
            { label: 'DB数量', value: String(cache.dbSize) }
          ]"
        />
      </RecordCard>

      <RecordCard icon="list" title="命令统计">
        <view v-if="cache.commandStats.length === 0" class="empty-notice">暂无命令统计</view>
        <view class="command-stats-list">
          <view v-for="item in cache.commandStats" :key="item.name" class="command-item">
            <text class="command-name">{{ item.name }}</text>
            <view class="command-progress-bar">
              <view class="progress-inner" :style="{ width: getCommandPercent(item.value) + '%' }"></view>
            </view>
            <text class="command-value">{{ item.value }}</text>
          </view>
        </view>
      </RecordCard>
    </view>

    <BottomNav active="admin" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getCache, type CacheVO } from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { handlePageError } from '@/utils/ui';
import { useSessionStore } from '@/store/session';
import RecordCard from '@/components/RecordCard.vue';
import KeyValueList from '@/components/KeyValueList.vue';
import StatusTag from '@/components/StatusTag.vue';
import BottomNav from '@/components/BottomNav.vue';

const sessionStore = useSessionStore();
const cache = reactive<CacheVO>({
  dbSize: 0,
  info: {},
  commandStats: []
});

const maxCommandValue = computed(() => {
  if (!cache.commandStats.length) return 1;
  return Math.max(...cache.commandStats.map(item => Number(item.value)));
});

const getCommandPercent = (value: string) => {
  return (Number(value) / maxCommandValue.value) * 100;
};

const loadData = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const response = await getCache();
    Object.assign(cache, response.data || {});
  } catch (error) {
    await handlePageError(error, '缓存信息加载失败');
  }
};

onShow(() => {
  void loadData();
});
</script>

<style lang="scss">
@import '@/styles/list.scss';

.command-stats-list {
  padding: 8rpx 32rpx 32rpx;

  .command-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 24rpx;

    &:last-child { margin-bottom: 0; }

    .command-name {
      width: 120rpx;
      font-size: 24rpx;
      color: #64748b;
      font-weight: 600;
    }

    .command-progress-bar {
      flex: 1;
      height: 12rpx;
      background: #f1f5f9;
      border-radius: 6rpx;
      overflow: hidden;

      .progress-inner {
        height: 100%;
        background: linear-gradient(90deg, $primary-color, #60a5fa);
        border-radius: 6rpx;
        transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    }

    .command-value {
      font-size: 24rpx;
      color: #1e293b;
      font-weight: 700;
      min-width: 60rpx;
      text-align: right;
    }
  }
}
</style>
