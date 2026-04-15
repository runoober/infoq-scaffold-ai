<template>
  <view class="home-container">
    <view class="welcome-section">
      <view class="avatar-wrapper">
        <text class="avatar-text">{{ displayName.slice(0, 1).toUpperCase() }}</text>
      </view>
      <view class="welcome-text">
        <view class="greet">您好，{{ displayName }}</view>
        <view class="dept">{{ sessionStore.user?.deptName || 'AI-first 全栈脚手架' }}</view>
      </view>
    </view>

    <swiper
      circular
      autoplay
      indicator-dots
      indicator-active-color="#1677ff"
      indicator-color="rgba(22, 119, 255, 0.2)"
      class="stats-swiper"
      :interval="4000"
      :duration="360"
    >
      <swiper-item class="stats-item">
        <view class="stats-card">
          <view class="stats-label">
            <AppIcon name="user" size="32" color="inherit" class="stats-icon-modern" />
            用户总数
          </view>
          <view class="stats-value">{{ summary.userTotal }}</view>
        </view>
      </swiper-item>
      <swiper-item class="stats-item">
        <view class="stats-card">
          <view class="stats-label">
            <AppIcon name="bookmark" size="32" color="inherit" class="stats-icon-modern" />
            角色总数
          </view>
          <view class="stats-value">{{ summary.roleTotal }}</view>
        </view>
      </swiper-item>
      <swiper-item class="stats-item">
        <view class="stats-card">
          <view class="stats-label">
            <AppIcon name="eye" size="32" color="inherit" class="stats-icon-modern" />
            在线设备
          </view>
          <view class="stats-value">{{ summary.onlineTotal }}</view>
        </view>
      </swiper-item>
    </swiper>

    <view class="notice-section" @click="openNotices">
      <view class="notice-bar">
        <AppIcon name="volume" size="36" color="#1677ff" class="notice-icon-modern" />
        <view class="notice-content">
          <view class="notice-scroll">
            {{ primaryNotice ? `${primaryNotice.noticeTitle} · ${primaryNotice.createTime}` : '暂无最新系统公告' }}
          </view>
        </view>
        <view class="notice-extra">详情</view>
      </view>
    </view>

    <view class="card-container grid-section">
      <view class="card-header">
        <text class="card-title">快捷入口</text>
        <text class="card-extra">管理台核心模块</text>
      </view>
      <view class="card-content">
        <view class="quick-grid">
          <view 
            class="quick-item" 
            v-for="item in gridItems" 
            :key="item.key"
            @click="handleGridClick(item)"
          >
            <view class="icon-box" :class="{ disabled: item.disabled }">
              <AppIcon :name="item.key" size="56" color="#1677ff" />
            </view>
            <text class="label" :class="{ disabled: item.disabled }">{{ item.title }}</text>
          </view>
        </view>
      </view>
    </view>

    <BottomNav active="home" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import BottomNav from '@/components/BottomNav.vue';
import AppIcon from '@/components/AppIcon.vue';
import { adminModules } from '@/utils/admin';
import { navigate, routes } from '@/utils/navigation';
import { handlePageError } from '@/utils/ui';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { listNotice, loadWorkbenchSummary, type NoticeVO } from '@/api';
import { useSessionStore } from '@/store/session';

const sessionStore = useSessionStore();
const recentNotices = ref<NoticeVO[]>([]);
const summary = ref({
  userTotal: 0,
  roleTotal: 0,
  onlineTotal: 0,
  loginTotal: 0
});

const displayName = computed(() => (sessionStore.user?.nickName || sessionStore.user?.userName || '用户'));

const primaryNotice = computed(() => recentNotices.value[0]);

const gridItems = computed(() => {
  const keys = ['users', 'roles', 'depts', 'notices', 'online', 'loginInfo'];
  return keys.map(key => {
    const mod = adminModules.find(m => m.key === key);
    if (!mod) return null;
    return {
      ...mod,
      disabled: !sessionStore.permissions.includes(mod.permission)
    };
  }).filter(Boolean);
});

const openNotices = () => {
  if (!sessionStore.permissions.includes('system:notice:list')) return;
  navigate(routes.notices);
};

const handleGridClick = async (item: any) => {
  if (item.disabled) {
    await uni.showToast({ title: '暂无权限访问', icon: 'none' });
    return;
  }
  navigate(item.url);
};

const loadPage = async () => {
  if (!ensureAuthenticated()) return;
  try {
    const session = await sessionStore.loadSession();
    if (!session) {
      uni.reLaunch({ url: routes.login });
      return;
    }
    summary.value = await loadWorkbenchSummary(sessionStore.permissions);
    if (sessionStore.permissions.includes('system:notice:list')) {
      const response = await listNotice({
        pageNum: 1, pageSize: 3, noticeTitle: '', createByName: '', status: '0', noticeType: ''
      });
      recentNotices.value = response.rows || [];
    }
  } catch (error) {
    await handlePageError(error, '首页加载失败');
  }
};

onShow(() => {
  void loadPage();
});
</script>

<style lang="scss">
@import './index.scss';

.stats-icon-modern {
  margin-right: 12rpx;
  opacity: 0.8;
}

.notice-icon-modern {
  margin-right: 16rpx;
  flex-shrink: 0;
}
</style>
