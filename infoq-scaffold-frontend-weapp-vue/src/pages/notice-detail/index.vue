<template>
  <view class="page-wrap">
    <view class="notice-detail-container" v-if="notice">
      <view class="detail-header">
        <text class="notice-title">{{ notice.noticeTitle }}</text>
        <view class="notice-meta">
          <text class="meta-item">{{ notice.createByName || '系统' }}</text>
          <text class="meta-divider">|</text>
          <text class="meta-item">{{ formatDateTime(notice.createTime) }}</text>
        </view>
      </view>

      <view class="card-container">
        <view class="card-header">
          <text class="card-title">公告内容</text>
          <StatusTag 
            :label="getDictLabel(typeOptions, notice.noticeType) || '公告'" 
            type="info"
          />
        </view>
        <view class="card-content rich-text-wrapper">
          <rich-text :nodes="notice.noticeContent || '<p>暂无内容</p>'" />
        </view>
      </view>

      <view class="card-container">
        <view class="card-header">
          <text class="card-title">基本信息</text>
        </view>
        <view class="card-content" style="padding: 0">
          <KeyValueList
            :items="[
              { label: '公告状态', value: getDictLabel(statusOptions, notice.status) || '未知' },
              { label: '备注说明', value: notice.remark || '无' }
            ]"
          />
        </view>
      </view>

      <view class="action-section">
        <button class="secondary-btn cancel-btn" @click="backOr(routes.notices)">返回列表</button>
        <button 
          v-if="canEdit"
          class="primary-btn save-btn" 
          @click="navigate(`${routes.noticeForm}?noticeId=${notice.noticeId}`)"
        >
          编辑公告
        </button>
        <button 
          v-if="canRemove"
          class="danger-btn delete-btn" 
          @click="handleDelete"
        >
          删除公告
        </button>
      </view>
    </view>
    <EmptyNotice v-else message="正在加载公告详情..." />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { delNotice, formatDateTime, getDictLabel, getDicts, getNotice, toDictOptions, type DictOption, type NoticeVO } from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { backOr, navigate, relaunch, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';
import StatusTag from '@/components/StatusTag.vue';
import KeyValueList from '@/components/KeyValueList.vue';
import EmptyNotice from '@/components/EmptyNotice.vue';

const sessionStore = useSessionStore();
const notice = ref<NoticeVO | null>(null);
const statusOptions = ref<DictOption[]>([]);
const typeOptions = ref<DictOption[]>([]);

const permissions = computed(() => sessionStore.permissions);
const canEdit = computed(() => permissions.value.includes('system:notice:edit'));
const canRemove = computed(() => permissions.value.includes('system:notice:remove'));

const loadNotice = async (noticeId: string) => {
  if (!ensureAuthenticated()) return;
  try {
    const [statusResponse, typeResponse, noticeResponse] = await Promise.all([
      getDicts('sys_notice_status'),
      getDicts('sys_notice_type'),
      getNotice(noticeId)
    ]);
    statusOptions.value = toDictOptions(statusResponse.data);
    typeOptions.value = toDictOptions(typeResponse.data);
    notice.value = noticeResponse.data;
  } catch (error) {
    await handlePageError(error, '公告详情加载失败');
  }
};

const handleDelete = async () => {
  if (!notice.value?.noticeId) return;
  const res = await uni.showModal({
    title: '确认删除',
    content: `确定删除公告 #${notice.value.noticeId} 吗？`,
    confirmColor: '#ef4444'
  });
  if (!res.confirm) return;

  try {
    await delNotice(String(notice.value.noticeId));
    await showSuccess('删除成功');
    relaunch(routes.notices);
  } catch (error) {
    await handlePageError(error, '公告删除失败');
  }
};

onLoad((query) => {
  const noticeId = String(query?.noticeId || '').trim();
  if (!noticeId) {
    relaunch(routes.notices);
    return;
  }
  void loadNotice(noticeId);
});
</script>

<style lang="scss" scoped>
@import '@/styles/common.scss';

.notice-detail-container {
  padding-bottom: 160rpx;
}

.detail-header {
  padding: 48rpx 32rpx;
  background: #fff;
  margin-bottom: 24rpx;
  
  .notice-title {
    font-size: 36rpx;
    font-weight: 800;
    color: #1e293b;
    line-height: 1.4;
    display: block;
    margin-bottom: 16rpx;
  }
  
  .notice-meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .meta-item {
      font-size: 24rpx;
      color: #94a3b8;
    }
    
    .meta-divider {
      color: #e2e8f0;
      font-size: 20rpx;
    }
  }
}

.rich-text-wrapper {
  padding: 32rpx;
  font-size: 28rpx;
  color: #334155;
  line-height: 1.8;
  word-break: break-all;
}

.delete-btn {
  flex: 1;
}
</style>
