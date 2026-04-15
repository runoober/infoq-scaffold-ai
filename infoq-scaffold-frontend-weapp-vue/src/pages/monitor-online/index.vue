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
      <EmptyNotice v-else-if="rows.length === 0" message="当前没有在线设备" />
      
      <template v-if="canList">
        <RecordCard
          v-for="item in rows"
          :key="item.tokenId"
          icon="eye"
          :title="item.userName || '未知用户'"
          status-color="#1677ff"
          :actions="getOnlineActions(item)"
        >
          <template #extra>
            <StatusTag 
              :label="getDictLabel(deviceOptions, item.deviceType) || '未知设备'" 
              type="info" 
            />
          </template>
          
          <KeyValueList
            :items="[
              { label: '所属部门', value: item.deptName || '-' },
              { label: '登录地址', value: item.ipaddr || '-' },
              { label: '浏览器', value: item.browser || '-' },
              { label: '操作系统', value: item.os || '-' },
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

    <BottomNav active="admin" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { 
  forceLogout, 
  getDictLabel, 
  getDicts, 
  listOnlineUsers, 
  toDictOptions, 
  type DictOption, 
  type OnlineVO 
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

const sessionStore = useSessionStore();
const rows = ref<OnlineVO[]>([]);
const total = ref(0);
const deviceOptions = ref<DictOption[]>([]);

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  ipaddr: '',
  userName: ''
});

const canList = computed(() => sessionStore.permissions.includes('monitor:online:list'));
const canForce = computed(() => sessionStore.permissions.includes('monitor:online:forceLogout'));

const loadData = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const [deviceResponse, listResponse] = await Promise.all([
      getDicts('sys_device_type'),
      canList.value ? listOnlineUsers(query) : Promise.resolve({ rows: [], total: 0 })
    ]);
    deviceOptions.value = toDictOptions(deviceResponse.data);
    rows.value = listResponse.rows || [];
    total.value = listResponse.total || 0;
  } catch (error) {
    await handlePageError(error, '在线用户加载失败');
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

const handleForceLogout = async (item: OnlineVO) => {
  const res = await uni.showModal({
    title: '确认强退',
    content: `确定强退用户 ${item.userName} 吗？`
  });
  if (!res.confirm) return;
  
  try {
    await forceLogout(item.tokenId);
    await showSuccess('设备已强退');
    await loadData();
  } catch (error) {
    await handlePageError(error, '强退失败');
  }
};

const getOnlineActions = (item: OnlineVO) => {
  const actions = [];
  if (canForce.value) {
    actions.push({ 
      title: '强退', 
      onClick: () => handleForceLogout(item),
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
