<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">角色名称</text>
          <view class="field-input-box">
            <input v-model="query.roleName" placeholder="按角色名称过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-field">
          <text class="field-label">权限字符</text>
          <view class="field-input-box">
            <input v-model="query.roleKey" placeholder="按权限字符过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-actions">
  <button class="secondary-btn search-action-btn" @click="handleReset">重置</button>
  <button class="primary-btn search-action-btn" @click="handleSearch">查询</button>
</view>
      </view>
    </view>

    <view class="list-content">
      <EmptyNotice v-if="!canList" message="当前账号没有访问权限" />
      <EmptyNotice v-else-if="rows.length === 0" message="未查询到相关角色" />
      
      <template v-if="canList">
        <RecordCard
          v-for="item in rows"
          :key="String(item.roleId)"
          icon="bookmark"
          :title="item.roleName"
          :status-color="item.status === '0' ? '#52c41a' : '#ff4d4f'"
          :actions="getRoleActions(item)"
        >
          <template #extra>
            <StatusTag 
              :label="getDictLabel(statusOptions, item.status) || '未知'" 
              :type="item.status === '0' ? 'success' : 'error'" 
            />
          </template>
          
          <KeyValueList
            :items="[
              { label: '权限字符', value: item.roleKey },
              { label: '显示顺序', value: String(item.roleSort) },
              { label: '创建时间', value: item.createTime ? String(item.createTime).split(' ')[0] : '-' }
            ]"
          />
        </RecordCard>

        <PaginationBar
          :current="query.pageNum"
          :page-size="query.pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </template>
    </view>

    <FabButton v-if="canAdd" @click="openCreate" />
    
    <BottomNav active="admin" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { 
  changeRoleStatus, 
  delRole, 
  getDictLabel, 
  getDicts, 
  listRole, 
  toDictOptions, 
  type DictOption, 
  type RoleVO 
} from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { navigate, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

import BottomNav from '@/components/BottomNav.vue';
import EmptyNotice from '@/components/EmptyNotice.vue';
import KeyValueList from '@/components/KeyValueList.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import RecordCard from '@/components/RecordCard.vue';
import StatusTag from '@/components/StatusTag.vue';
import FabButton from '@/components/FabButton.vue';

const sessionStore = useSessionStore();
const rows = ref<RoleVO[]>([]);
const total = ref(0);
const statusOptions = ref<DictOption[]>([]);

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  roleName: '',
  roleKey: '',
  status: ''
});

const canList = computed(() => sessionStore.permissions.includes('system:role:list'));
const canAdd = computed(() => sessionStore.permissions.includes('system:role:add'));
const canEdit = computed(() => sessionStore.permissions.includes('system:role:edit'));
const canRemove = computed(() => sessionStore.permissions.includes('system:role:remove'));

const loadData = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const [statusResponse, listResponse] = await Promise.all([
      getDicts('sys_normal_disable'),
      canList.value ? listRole(query) : Promise.resolve({ rows: [], total: 0 })
    ]);
    statusOptions.value = toDictOptions(statusResponse.data);
    rows.value = listResponse.rows || [];
    total.value = listResponse.total || 0;
  } catch (error) {
    await handlePageError(error, '角色列表加载失败');
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  void loadData();
};

const handleReset = () => {
  query.pageNum = 1;
  query.roleName = '';
  query.roleKey = '';
  void loadData();
};

const handlePageChange = (page: number) => {
  query.pageNum = page;
  void loadData();
};

const openCreate = () => {
  navigate(routes.roleForm);
};

const openEdit = (roleId: string | number) => {
  navigate(`${routes.roleForm}?roleId=${roleId}`);
};

const handleDelete = async (roleId: string | number) => {
  const res = await uni.showModal({
    title: '确认删除',
    content: `确定删除角色 #${roleId} 吗？`
  });
  if (!res.confirm) return;
  
  try {
    await delRole(roleId);
    await showSuccess('角色已删除');
    await loadData();
  } catch (error) {
    await handlePageError(error, '角色删除失败');
  }
};

const handleToggleStatus = async (item: RoleVO) => {
  try {
    await changeRoleStatus(item.roleId, item.status === '0' ? '1' : '0');
    await showSuccess(item.status === '0' ? '角色已停用' : '角色已启用');
    await loadData();
  } catch (error) {
    await handlePageError(error, '角色状态更新失败');
  }
};

const getRoleActions = (item: RoleVO) => {
  const actions = [];
  if (canEdit.value) {
    actions.push({ title: '编辑', onClick: () => openEdit(item.roleId) });
    if (!item.admin) {
      actions.push({ 
        title: item.status === '0' ? '停用' : '启用', 
        onClick: () => handleToggleStatus(item),
        danger: item.status === '0'
      });
    }
  }
  if (canRemove.value && !item.admin) {
    actions.push({ 
      title: '删除', 
      onClick: () => handleDelete(item.roleId),
      danger: true
    });
  }
  return actions;
};

onShow(() => {
  void loadData();
});
</script>

<style lang="scss">
@import './index.scss';
</style>
