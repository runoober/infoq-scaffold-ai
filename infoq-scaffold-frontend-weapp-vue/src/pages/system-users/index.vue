<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">登录账号</text>
          <view class="field-input-box">
            <input v-model="query.userName" placeholder="按登录账号过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-field">
          <text class="field-label">用户昵称</text>
          <view class="field-input-box">
            <input v-model="query.nickName" placeholder="按用户昵称过滤" placeholder-style="color: #94a3b8" />
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
      <EmptyNotice v-else-if="rows.length === 0" message="未查询到相关用户" />
      
      <template v-if="canList">
        <RecordCard
          v-for="item in rows"
          :key="item.userId"
          icon="user"
          :title="item.nickName || item.userName || '未知用户'"
          :status-color="item.status === '0' ? '#52c41a' : '#ff4d4f'"
          :actions="getUserActions(item)"
        >
          <template #extra>
            <StatusTag 
              :label="getDictLabel(statusOptions, item.status) || '未知'" 
              :type="item.status === '0' ? 'success' : 'error'" 
            />
          </template>
          
          <KeyValueList
            :items="[
              { label: '登录账号', value: item.userName || '-' },
              { label: '所属部门', value: item.deptName || '-' },
              { label: '手机号码', value: item.phonenumber || '-' },
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
  changeUserStatus, 
  delUser, 
  getDictLabel, 
  getDicts, 
  listUser, 
  toDictOptions, 
  type DictOption, 
  type UserVO 
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
const rows = ref<UserVO[]>([]);
const total = ref(0);
const statusOptions = ref<DictOption[]>([]);

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  nickName: '',
  phonenumber: '',
  status: ''
});

const canList = computed(() => sessionStore.permissions.includes('system:user:list'));
const canAdd = computed(() => sessionStore.permissions.includes('system:user:add'));
const canEdit = computed(() => sessionStore.permissions.includes('system:user:edit'));
const canRemove = computed(() => sessionStore.permissions.includes('system:user:remove'));

const loadData = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const [statusResponse, listResponse] = await Promise.all([
      getDicts('sys_normal_disable'),
      canList.value ? listUser(query) : Promise.resolve({ rows: [], total: 0 })
    ]);
    statusOptions.value = toDictOptions(statusResponse.data);
    rows.value = listResponse.rows || [];
    total.value = listResponse.total || 0;
  } catch (error) {
    await handlePageError(error, '用户列表加载失败');
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  void loadData();
};

const handleReset = () => {
  query.pageNum = 1;
  query.userName = '';
  query.nickName = '';
  query.phonenumber = '';
  query.status = '';
  void loadData();
};

const handlePageChange = (page: number) => {
  query.pageNum = page;
  void loadData();
};

const openCreate = () => {
  navigate(routes.userForm);
};

const openEdit = (userId: string | number) => {
  navigate(`${routes.userForm}?userId=${userId}`);
};

const handleDelete = async (userId: string | number) => {
  const res = await uni.showModal({
    title: '确认删除',
    content: `确定删除用户 #${userId} 吗？`
  });
  if (!res.confirm) return;
  
  try {
    await delUser(userId);
    await showSuccess('用户已删除');
    await loadData();
  } catch (error) {
    await handlePageError(error, '用户删除失败');
  }
};

const handleToggleStatus = async (item: UserVO) => {
  try {
    await changeUserStatus(String(item.userId), item.status === '0' ? '1' : '0');
    await showSuccess(item.status === '0' ? '用户已停用' : '用户已启用');
    await loadData();
  } catch (error) {
    await handlePageError(error, '用户状态更新失败');
  }
};

const getUserActions = (item: UserVO) => {
  const actions = [];
  if (canEdit.value) {
    actions.push({ title: '编辑', onClick: () => openEdit(String(item.userId)) });
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
      onClick: () => handleDelete(String(item.userId)),
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
