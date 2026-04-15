<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">数据标签</text>
          <view class="field-input-box">
            <input v-model="query.dictLabel" placeholder="按数据标签过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-actions">
  <button class="secondary-btn search-action-btn" @click="handleReset">重置</button>
  <button class="primary-btn search-action-btn" @click="handleSearch">查询</button>
</view>
      </view>
    </view>

    <view class="list-content">
      <view class="info-bar" v-if="dictType">
        <text class="info-text">当前字典类型: {{ dictType }}</text>
      </view>

      <EmptyNotice v-if="rows.length === 0" message="未查询到相关数据项" />
      
      <RecordCard
        v-for="item in rows"
        :key="String(item.dictCode)"
        icon="tag"
        :title="item.dictLabel"
      >
        <template #extra>
          <StatusTag 
            :label="item.status === '0' ? '正常' : '停用'" 
            :type="item.status === '0' ? 'success' : 'error'" 
          />
        </template>
        
        <KeyValueList
          :items="[
            { label: '字典键值', value: item.dictValue || '-' },
            { label: '字典排序', value: String(item.dictSort ?? 0) },
            { label: '备注', value: item.remark || '-' },
            { label: '创建时间', value: item.createTime ? String(item.createTime).split(' ')[0] : '-' }
          ]"
        />
      </RecordCard>
    </view>
    
    <BottomNav active="admin" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { listData, type DictDataVO } from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { handlePageError } from '@/utils/ui';
import { useSessionStore } from '@/store/session';
import RecordCard from '@/components/RecordCard.vue';
import KeyValueList from '@/components/KeyValueList.vue';
import StatusTag from '@/components/StatusTag.vue';
import EmptyNotice from '@/components/EmptyNotice.vue';
import BottomNav from '@/components/BottomNav.vue';

const sessionStore = useSessionStore();
const rows = ref<DictDataVO[]>([]);
const dictType = ref('');

const query = reactive({
  pageNum: 1,
  pageSize: 100,
  dictLabel: ''
});

const loadData = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const response = await listData({
      ...query,
      dictType: dictType.value
    });
    rows.value = response.rows || [];
  } catch (error) {
    await handlePageError(error, '字典数据加载失败');
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  loadData();
};

const handleReset = () => {
  query.dictLabel = '';
  handleSearch();
};

onLoad((q) => {
  dictType.value = String(q?.dictType || '');
});

onShow(() => {
  loadData();
});
</script>

<style lang="scss">
@import '@/styles/list.scss';

.info-bar {
  margin: 16rpx 24rpx;
  padding: 16rpx 24rpx;
  background: rgba($primary-color, 0.05);
  border-radius: 12rpx;
  border: 1rpx solid rgba($primary-color, 0.1);
  
  .info-text {
    font-size: 24rpx;
    color: $primary-color;
    font-weight: 600;
  }
}
</style>
