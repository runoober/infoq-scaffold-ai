<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">公告标题</text>
          <view class="field-input-box">
            <input v-model="query.noticeTitle" placeholder="按公告标题过滤" placeholder-style="color: #94a3b8" />
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
      <EmptyNotice v-else-if="rows.length === 0" message="未查询到相关公告" />
      
      <template v-if="canList">
        <RecordCard
          v-for="item in rows"
          :key="item.noticeId"
          icon="message"
          :title="item.noticeTitle || '未知公告'"
          :status-color="item.status === '0' ? '#52c41a' : '#ff4d4f'"
          :actions="getNoticeActions(item)"
        >
          <template #extra>
            <StatusTag 
              :label="getDictLabel(typeOptions, item.noticeType) || '未知'" 
              type="info"
            />
          </template>
          
          <KeyValueList
            :items="[
              { label: '状态', value: item.status === '0' ? '正常' : '停用' },
              { label: '创建人', value: item.createByName || '-' },
              { label: '创建时间', value: formatDateTime(item.createTime) }
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
  delNotice, 
  formatDateTime, 
  getDictLabel, 
  getDicts, 
  listNotice, 
  toDictOptions, 
  type DictOption, 
  type NoticeVO 
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
const rows = ref<NoticeVO[]>([]);
const total = ref(0);
const typeOptions = ref<DictOption[]>([]);

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  noticeTitle: '',
  createByName: '',
  status: '',
  noticeType: ''
});

const canList = computed(() => sessionStore.permissions.includes('system:notice:list'));
const canAdd = computed(() => sessionStore.permissions.includes('system:notice:add'));
const canEdit = computed(() => sessionStore.permissions.includes('system:notice:edit'));
const canRemove = computed(() => sessionStore.permissions.includes('system:notice:remove'));

const loadData = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const [typeResponse, listResponse] = await Promise.all([
      getDicts('sys_notice_type'),
      canList.value ? listNotice(query) : Promise.resolve({ rows: [], total: 0 })
    ]);
    typeOptions.value = toDictOptions(typeResponse.data);
    rows.value = listResponse.rows || [];
    total.value = listResponse.total || 0;
  } catch (error) {
    await handlePageError(error, '公告列表加载失败');
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  void loadData();
};

const handleReset = () => {
  query.pageNum = 1;
  query.noticeTitle = '';
  void loadData();
};

const handlePageChange = (page: number) => {
  query.pageNum = page;
  void loadData();
};

const openCreate = () => {
  navigate(routes.noticeForm);
};

const openDetail = (noticeId: number) => {
  navigate(`${routes.noticeDetail}?noticeId=${noticeId}`);
};

const openEdit = (noticeId: number) => {
  navigate(`${routes.noticeForm}?noticeId=${noticeId}`);
};

const handleDelete = async (noticeId: number) => {
  const res = await uni.showModal({
    title: '确认删除',
    content: `确定删除公告 #${noticeId} 吗？`
  });
  if (!res.confirm) return;
  
  try {
    await delNotice(noticeId);
    await showSuccess('公告已删除');
    await loadData();
  } catch (error) {
    await handlePageError(error, '公告删除失败');
  }
};

const getNoticeActions = (item: NoticeVO) => {
  const actions = [];
  actions.push({ title: '详情', onClick: () => openDetail(item.noticeId!) });
  if (canEdit.value) {
    actions.push({ title: '编辑', onClick: () => openEdit(item.noticeId!) });
  }
  if (canRemove.value) {
    actions.push({ 
      title: '删除', 
      onClick: () => handleDelete(item.noticeId!),
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
