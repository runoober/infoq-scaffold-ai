<template>
  <view class="list-container">
    <view class="search-section">
      <view class="search-card">
        <view class="search-field">
          <text class="field-label">模块标题</text>
          <view class="field-input-box">
            <input v-model="query.title" placeholder="按模块标题过滤" placeholder-style="color: #94a3b8" />
          </view>
        </view>
        <view class="search-field">
          <text class="field-label">操作人员</text>
          <view class="field-input-box">
            <input v-model="query.operName" placeholder="按操作人员过滤" placeholder-style="color: #94a3b8" />
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
          :key="String(item.operId)"
          icon="list"
          :title="item.title || '操作日志'"
          :status-color="item.status === 0 ? '#52c41a' : '#ff4d4f'"
          :actions="getOperLogActions(item)"
        >
          <template #extra>
            <StatusTag 
              :label="getDictLabel(statusOptions, String(item.status)) || '未知'" 
              :type="item.status === 0 ? 'success' : 'error'" 
            />
          </template>
          
          <KeyValueList
            :items="[
              { label: '操作人员', value: (item.operName || '-') + ' (' + (item.deptName || '-') + ')' },
              { label: '业务类型', value: getDictLabel(typeOptions, String(item.businessType)) || '-' },
              { label: '请求路径', value: item.operUrl || '-' },
              { label: '操作地址', value: item.operIp || '-' },
              { label: '操作时间', value: item.operTime ? String(item.operTime) : '-' }
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

    <!-- Detail Modal -->
    <view v-if="detailVisible" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 1001; display: flex; align-items: center; justify-content: center">
      <view style="background: #fff; width: 640rpx; border-radius: 24rpx; padding: 40rpx; box-sizing: border-box; max-height: 80vh; overflow-y: auto">
        <view style="font-size: 34rpx; font-weight: 600; text-align: center; margin-bottom: 32rpx">操作详情</view>
        <view v-if="selectedLog">
          <KeyValueList
            :items="[
              { label: '系统模块', value: selectedLog.title || '-' },
              { label: '业务类型', value: getDictLabel(typeOptions, String(selectedLog.businessType)) || '-' },
              { label: '请求方式', value: selectedLog.requestMethod || '-' },
              { label: '操作人员', value: selectedLog.operName || '-' },
              { label: '部门名称', value: selectedLog.deptName || '-' },
              { label: '操作地址', value: selectedLog.operIp || '-' },
              { label: '操作时间', value: selectedLog.operTime || '-' },
              { label: '请求路径', value: selectedLog.operUrl || '-' },
              { label: '操作方法', value: selectedLog.method || '-' },
              { label: '请求参数', value: selectedLog.operParam || '-' },
              { label: '返回参数', value: selectedLog.jsonResult || '-' },
              { label: '状态', value: selectedLog.status === 0 ? '成功' : '失败' },
              { label: '错误消息', value: selectedLog.errorMsg || '-' }
            ]"
          />
        </view>
        <button class="secondary-btn" style="width: 100%; margin-top: 32rpx" @click="detailVisible = false">关闭</button>
      </view>
    </view>

    <FabButton v-if="canRemove" @click="handleClean" />
    
    <BottomNav active="admin" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { 
  cleanOperLog, 
  delOperLog, 
  getDictLabel, 
  getDicts, 
  listOperLog, 
  toDictOptions, 
  type DictOption, 
  type OperLogVO 
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
const rows = ref<OperLogVO[]>([]);
const total = ref(0);
const statusOptions = ref<DictOption[]>([]);
const typeOptions = ref<DictOption[]>([]);

const detailVisible = ref(false);
const selectedLog = ref<OperLogVO | null>(null);

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  operIp: '',
  title: '',
  operName: '',
  businessType: '',
  status: '',
  orderByColumn: 'operTime',
  isAsc: 'descending'
});

const canList = computed(() => sessionStore.permissions.includes('monitor:operLog:list'));
const canRemove = computed(() => sessionStore.permissions.includes('monitor:operLog:remove'));
const canQuery = computed(() => sessionStore.permissions.includes('monitor:operLog:query'));

const loadData = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const [statusResponse, typeResponse, listResponse] = await Promise.all([
      getDicts('sys_common_status'),
      getDicts('sys_oper_type'),
      canList.value ? listOperLog(query) : Promise.resolve({ rows: [], total: 0 })
    ]);
    statusOptions.value = toDictOptions(statusResponse.data);
    typeOptions.value = toDictOptions(typeResponse.data);
    rows.value = listResponse.rows || [];
    total.value = listResponse.total || 0;
  } catch (error) {
    await handlePageError(error, '操作日志加载失败');
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  void loadData();
};

const handleReset = () => {
  query.pageNum = 1;
  query.title = '';
  query.operName = '';
  void loadData();
};

const handlePageChange = (page: number) => {
  query.pageNum = page;
  void loadData();
};

const handleDelete = async (operId: string | number) => {
  const res = await uni.showModal({
    title: '确认删除',
    content: `确定删除日志 #${operId} 吗？`
  });
  if (!res.confirm) return;
  
  try {
    await delOperLog(operId);
    await showSuccess('日志已删除');
    await loadData();
  } catch (error) {
    await handlePageError(error, '日志删除失败');
  }
};

const handleClean = async () => {
  const res = await uni.showModal({
    title: '确认清空',
    content: '确定清空所有操作日志吗？'
  });
  if (!res.confirm) return;
  
  try {
    await cleanOperLog();
    await showSuccess('操作日志已清空');
    handleSearch();
  } catch (error) {
    await handlePageError(error, '清空失败');
  }
};

const getOperLogActions = (item: OperLogVO) => {
  const actions = [];
  if (canQuery.value) {
    actions.push({ 
      title: '详情', 
      onClick: () => {
        selectedLog.value = item;
        detailVisible.value = true;
      } 
    });
  }
  if (canRemove.value) {
    actions.push({ 
      title: '删除', 
      onClick: () => handleDelete(item.operId!),
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
