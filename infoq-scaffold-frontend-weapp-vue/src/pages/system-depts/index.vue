<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">部门名称</text>
          <view class="field-input-box">
            <input v-model="query.deptName" placeholder="按部门名称过滤" placeholder-style="color: #94a3b8" />
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
      <EmptyNotice v-else-if="filteredRows.length === 0" message="未查询到相关部门" />
      
      <template v-if="canList">
        <RecordCard
          v-for="item in filteredRows"
          :key="String(item.deptId)"
          icon="folder"
          :title="item.deptName"
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
              { label: '负责人', value: item.leader || '-' },
              { label: '联系电话', value: item.phone || '-' },
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
import { delDept, listDept, type DeptVO } from '@/api';
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
const rows = ref<DeptVO[]>([]);
const query = reactive({
  deptName: '',
  status: ''
});

const canList = computed(() => sessionStore.permissions.includes('system:dept:list'));
const canAdd = computed(() => sessionStore.permissions.includes('system:dept:add'));
const canEdit = computed(() => sessionStore.permissions.includes('system:dept:edit'));
const canRemove = computed(() => sessionStore.permissions.includes('system:dept:remove'));

const filteredRows = computed(() => {
  if (!query.deptName) return rows.value;
  const filter = query.deptName.toLowerCase();
  return rows.value.filter(r => r.deptName.toLowerCase().includes(filter));
});

const loadData = async () => {
  if (!ensureAuthenticated()) return;
  try {
    await sessionStore.loadSession();
    const response = await listDept();
    rows.value = response.data || [];
  } catch (error) {
    await handlePageError(error, '部门加载失败');
  }
};

const handleReset = () => {
  query.deptName = '';
  void loadData();
};

const openCreate = () => navigate(routes.deptForm);

const getActions = (item: DeptVO) => {
  const actions = [];
  if (canEdit.value) {
    actions.push({ title: '编辑', onClick: () => navigate(`${routes.deptForm}?deptId=${item.deptId}`) });
  }
  if (canRemove.value) {
    actions.push({ title: '删除', danger: true, onClick: () => removeItem(item.deptId) });
  }
  return actions;
};

const removeItem = async (deptId: string | number) => {
  const res = await uni.showModal({ title: '确认删除', content: '确定删除该部门吗？' });
  if (!res.confirm) return;
  try {
    await delDept(deptId);
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
