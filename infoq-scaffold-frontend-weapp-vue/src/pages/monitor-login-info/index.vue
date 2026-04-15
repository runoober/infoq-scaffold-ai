<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">用户名称</text>
          <view class="field-input-box">
            <input v-model="query.userName" placeholder="按用户名称过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-field">
          <text class="field-label">登录地址</text>
          <view class="field-input-box">
            <input v-model="query.ipaddr" placeholder="按登录地址过滤" placeholder-style="color: #94a3b8" />
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
      <EmptyNotice v-else-if="rows.length === 0" message="未查询到相关日志" />
      
      <template v-if="canList">
        <RecordCard
          v-for="item in rows"
          :key="String(item.infoId)"
          icon="file-generic"
          :title="item.userName || '未知用户'"
          :status-color="item.status === '0' ? '#52c41a' : '#ff4d4f'"
          :actions="getLoginInfoActions(item)"
        >
          <template #extra>
            <StatusTag 
              :label="getDictLabel(statusOptions, item.status) || '未知'" 
              :type="item.status === '0' ? 'success' : 'error'" 
            />
          </template>
          
          <KeyValueList
            :items="[
              { label: '登录地址', value: item.ipaddr || '-' },
              { label: '浏览器', value: item.browser || '-' },
              { label: '操作系统', value: item.os || '-' },
              { label: '结果信息', value: item.msg || '-' },
              { label: '登录时间', value: item.loginTime ? String(item.loginTime) : '-' }
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

    <FabButton v-if="canRemove" @click="handleClean" />
    
    <BottomNav active="admin" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { 
  cleanLoginInfo, 
  delLoginInfo, 
  getDictLabel, 
  getDicts, 
  listLoginInfo, 
  toDictOptions, 
  unlockLoginInfo, 
  type DictOption, 
  type LoginInfoVO 
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
const rows = ref<LoginInfoVO[]>([]);
const total = ref(0);
const statusOptions = ref<DictOption[]>([]);

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  ipaddr: '',
  userName: '',
  status: '',
  orderByColumn: 'loginTime',
  isAsc: 'descending'
});

const canList = computed(() => sessionStore.permissions.includes('monitor:loginInfo:list'));
const canRemove = computed(() => sessionStore.permissions.includes('monitor:loginInfo:remove'));
const canUnlock = computed(() => sessionStore.permissions.includes('monitor:loginInfo:unlock'));

const loadData = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const [statusResponse, listResponse] = await Promise.all([
      getDicts('sys_common_status'),
      canList.value ? listLoginInfo(query) : Promise.resolve({ rows: [], total: 0 })
    ]);
    statusOptions.value = toDictOptions(statusResponse.data);
    rows.value = listResponse.rows || [];
    total.value = listResponse.total || 0;
  } catch (error) {
    await handlePageError(error, '登录日志加载失败');
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  void loadData();
};

const handleReset = () => {
  query.pageNum = 1;
  query.userName = '';
  query.ipaddr = '';
  void loadData();
};

const handlePageChange = (page: number) => {
  query.pageNum = page;
  void loadData();
};

const handleDelete = async (infoId: string | number) => {
  const res = await uni.showModal({
    title: '确认删除',
    content: `确定删除日志 #${infoId} 吗？`
  });
  if (!res.confirm) return;
  
  try {
    await delLoginInfo(infoId);
    await showSuccess('日志已删除');
    await loadData();
  } catch (error) {
    await handlePageError(error, '日志删除失败');
  }
};

const handleUnlock = async (userName: string) => {
  try {
    await unlockLoginInfo(userName);
    await showSuccess('账号已解锁');
  } catch (error) {
    await handlePageError(error, '账号解锁失败');
  }
};

const handleClean = async () => {
  const res = await uni.showModal({
    title: '确认清空',
    content: '确定清空所有登录日志吗？'
  });
  if (!res.confirm) return;
  
  try {
    await cleanLoginInfo();
    await showSuccess('登录日志已清空');
    handleSearch();
  } catch (error) {
    await handlePageError(error, '清空失败');
  }
};

const getLoginInfoActions = (item: LoginInfoVO) => {
  const actions = [];
  if (canUnlock.value && item.userName) {
    actions.push({ title: '解锁', onClick: () => handleUnlock(item.userName!) });
  }
  if (canRemove.value) {
    actions.push({ 
      title: '删除', 
      onClick: () => handleDelete(item.infoId!),
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
