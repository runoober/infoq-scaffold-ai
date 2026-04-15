<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">字典名称</text>
          <view class="field-input-box">
            <input v-model="query.dictName" placeholder="按字典名称过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-field">
          <text class="field-label">字典类型</text>
          <view class="field-input-box">
            <input v-model="query.dictType" placeholder="按字典类型过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-actions">
  <button class="secondary-btn search-action-btn" @click="handleReset">重置</button>
  <button class="primary-btn search-action-btn" @click="handleSearch">查询</button>
</view>
      </view>
    </view>

    <view class="list-content">
      <EmptyNotice v-if="rows.length === 0" message="未查询到相关字典" />
      
      <RecordCard
        v-for="item in rows"
        :key="item.dictId"
        icon="bookmark"
        :title="item.dictName"
        :actions="[{ title: '数据列表', onClick: () => openData(item.dictType) }]"
      >
        <template #extra>
          <StatusTag 
            :label="item.status === '0' ? '正常' : '停用'" 
            :type="item.status === '0' ? 'success' : 'error'" 
          />
        </template>
        
        <KeyValueList
          :items="[
            { label: '字典类型', value: item.dictType },
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
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { listType, type DictTypeVO } from '@/api';
import { navigate, routes } from '@/utils/navigation';
import { handlePageError } from '@/utils/ui';
import { ensureAuthenticated } from '@/composables/use-auth-guard';

import BottomNav from '@/components/BottomNav.vue';
import EmptyNotice from '@/components/EmptyNotice.vue';
import KeyValueList from '@/components/KeyValueList.vue';
import RecordCard from '@/components/RecordCard.vue';
import StatusTag from '@/components/StatusTag.vue';

const rows = ref<DictTypeVO[]>([]);
const query = reactive({
  pageNum: 1,
  pageSize: 100,
  dictName: '',
  dictType: '',
  status: ''
});

const loadData = async () => {
  if (!ensureAuthenticated()) return;
  try {
    const response = await listType(query);
    rows.value = response.rows || [];
  } catch (error) {
    await handlePageError(error, '字典数据加载失败');
  }
};

const handleReset = () => {
  query.dictName = '';
  query.dictType = '';
  void loadData();
};

const openData = (dictType: string) => {
  navigate(`${routes.dictData}?dictType=${dictType}`);
};

onShow(() => {
  void loadData();
});
</script>

<style lang="scss">
@import '../../styles/list.scss';
</style>
