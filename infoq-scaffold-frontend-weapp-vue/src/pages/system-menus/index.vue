<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">菜单名称</text>
          <view class="field-input-box">
            <input v-model="query.menuName" placeholder="按菜单名称过滤" placeholder-style="color: #94a3b8" />
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
      <EmptyNotice v-else-if="filteredRows.length === 0" message="未查询到相关菜单" />
      
      <template v-if="canList">
        <RecordCard
          v-for="item in filteredRows"
          :key="String(item.menuId)"
          icon="menu"
          :title="item.menuName"
          :actions="getActions(item)"
        >
          <template #extra>
            <StatusTag 
              :label="item.status === '0' ? '显示' : '隐藏'" 
              :type="item.status === '0' ? 'success' : 'error'" 
            />
          </template>
          
          <KeyValueList
            :items="[
              { label: '菜单类型', value: getMenuTypeLabel(item.menuType) },
              { label: '权限标识', value: item.perms || '-' },
              { label: '路由地址', value: item.path || '-' }
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
import { delMenu, listMenu, type MenuVO } from '@/api';
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
const rows = ref<MenuVO[]>([]);
const query = reactive({
  menuName: '',
  status: ''
});

const canList = computed(() => sessionStore.permissions.includes('system:menu:list'));
const canAdd = computed(() => sessionStore.permissions.includes('system:menu:add'));
const canEdit = computed(() => sessionStore.permissions.includes('system:menu:edit'));
const canRemove = computed(() => sessionStore.permissions.includes('system:menu:remove'));

const filteredRows = computed(() => {
  if (!query.menuName) return rows.value;
  const filter = query.menuName.toLowerCase();
  return rows.value.filter(r => r.menuName.toLowerCase().includes(filter));
});

const getMenuTypeLabel = (type: string) => {
  const map: Record<string, string> = { M: '目录', C: '菜单', F: '按钮' };
  return map[type] || type;
};

const loadData = async () => {
  if (!ensureAuthenticated()) return;
  try {
    await sessionStore.loadSession();
    const response = await listMenu();
    rows.value = response.data || [];
  } catch (error) {
    await handlePageError(error, '菜单加载失败');
  }
};

const handleReset = () => {
  query.menuName = '';
  void loadData();
};

const openCreate = () => navigate(routes.menuForm);

const getActions = (item: MenuVO) => {
  const actions = [];
  if (canEdit.value) {
    actions.push({ title: '编辑', onClick: () => navigate(`${routes.menuForm}?menuId=${item.menuId}`) });
  }
  if (canRemove.value) {
    actions.push({ title: '删除', danger: true, onClick: () => removeItem(item.menuId) });
  }
  return actions;
};

const removeItem = async (menuId: string | number) => {
  const res = await uni.showModal({ title: '确认删除', content: '确定删除该菜单项吗？' });
  if (!res.confirm) return;
  try {
    await delMenu(menuId);
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
