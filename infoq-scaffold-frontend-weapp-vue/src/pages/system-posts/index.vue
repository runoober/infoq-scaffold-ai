<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">岗位名称</text>
          <view class="field-input-box">
            <input v-model="query.postName" placeholder="按岗位名称过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-actions">
  <button class="secondary-btn search-action-btn" @click="handleReset">重置</button>
  <button class="primary-btn search-action-btn" @click="handleSearch">查询</button>
</view>
      </view>
    </view>

    <view class="list-content">
      <EmptyNotice v-if="!canList" message="暂无访问权限" />
      <EmptyNotice v-else-if="rows.length === 0" message="未查询到相关岗位" />
      
      <template v-if="canList">
        <RecordCard
          v-for="item in rows"
          :key="String(item.postId)"
          icon="calendar"
          :title="item.postName"
          :status-color="item.status === '0' ? '#52c41a' : '#ff4d4f'"
          :actions="getActions(item)"
        >
          <template #extra>
            <StatusTag 
              :label="item.status === '0' ? '正常' : '停用'" 
              :type="item.status === '0' ? 'success' : 'error'" 
            />
          </template>
          
          <KeyValueList
            :items="[
              { label: '岗位编码', value: item.postCode || '-' },
              { label: '显示顺序', value: String(item.postSort) },
              { label: '创建时间', value: item.createTime ? String(item.createTime).split(' ')[0] : '-' }
            ]"
          />
        </RecordCard>
      </template>
    </view>

    <FabButton v-if="canAdd" @click="openCreate" />
    
    <BottomNav active="admin" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { delPost, listPost, type PostVO } from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { navigate, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

import BottomNav from '@/components/BottomNav.vue';
import EmptyNotice from '@/components/EmptyNotice.vue';
import KeyValueList from '@/components/KeyValueList.vue';
import RecordCard from '@/components/RecordCard.vue';
import StatusTag from '@/components/StatusTag.vue';
import FabButton from '@/components/FabButton.vue';

const sessionStore = useSessionStore();
const rows = ref<PostVO[]>([]);
const query = reactive({
  pageNum: 1,
  pageSize: 20,
  postName: '',
  status: ''
});

const canList = computed(() => sessionStore.permissions.includes('system:post:list'));
const canAdd = computed(() => sessionStore.permissions.includes('system:post:add'));
const canEdit = computed(() => sessionStore.permissions.includes('system:post:edit'));
const canRemove = computed(() => sessionStore.permissions.includes('system:post:remove'));

const loadData = async () => {
  if (!ensureAuthenticated()) return;
  try {
    await sessionStore.loadSession();
    const response = await listPost(query as any);
    rows.value = response.rows || [];
  } catch (error) {
    await handlePageError(error, '岗位加载失败');
  }
};

const handleReset = () => {
  query.postName = '';
  void loadData();
};

const openCreate = () => navigate(routes.postForm);

const getActions = (item: PostVO) => {
  const actions = [];
  if (canEdit.value) {
    actions.push({ title: '编辑', onClick: () => navigate(`${routes.postForm}?postId=${item.postId}`) });
  }
  if (canRemove.value) {
    actions.push({ title: '删除', danger: true, onClick: () => removeItem(item.postId) });
  }
  return actions;
};

const removeItem = async (postId: string | number) => {
  const res = await uni.showModal({ title: '确认删除', content: '确定删除该岗位吗？' });
  if (!res.confirm) return;
  try {
    await delPost(postId);
    await showSuccess('删除成功');
    await loadData();
  } catch (error) {
    await handlePageError(error, '删除失败');
  }
};

onShow(() => {
  void loadData();
});
</script>

<style lang="scss">
@import './index.scss';
</style>
