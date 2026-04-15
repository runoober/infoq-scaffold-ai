<template>
  <view class="admin-container">
    <view class="admin-banner">
      <view class="banner-content">
        <view class="title">移动管理台</view>
        <view class="desc">AI-first 数字化管控中心</view>
      </view>
    </view>

    <view class="admin-content-wrapper">
      <!-- System Management -->
      <view class="admin-section card-container">
        <view class="card-header">
          <view class="card-title">系统管理</view>
          <view class="card-extra" v-if="systemModules.length">{{ systemModules.length }} 模块</view>
        </view>
        
        <view class="card-content">
          <view class="module-grid" v-if="systemModules.length">
            <view
              class="module-item"
              v-for="item in systemModules"
              :key="item.key"
              @click="navigate(item.url)"
            >
              <view class="icon-wrapper">
                <AppIcon :name="item.key" size="56" color="#1677ff" />
              </view>
              <text class="module-label">{{ item.title }}</text>
            </view>
          </view>
          <view class="empty-state" v-else>
            <text class="empty-text">无系统管理权限</text>
          </view>
        </view>
      </view>

      <!-- System Monitoring -->
      <view class="admin-section card-container">
        <view class="card-header">
          <view class="card-title">系统监控</view>
          <view class="card-extra" v-if="monitorModules.length">{{ monitorModules.length }} 指标</view>
        </view>
        
        <view class="card-content">
          <view class="module-grid" v-if="monitorModules.length">
            <view
              class="module-item"
              v-for="item in monitorModules"
              :key="item.key"
              @click="navigate(item.url)"
            >
              <view class="icon-wrapper monitor">
                <AppIcon :name="item.key" size="56" color="#52c41a" />
              </view>
              <text class="module-label">{{ item.title }}</text>
            </view>
          </view>
          <view class="empty-state" v-else>
            <text class="empty-text">无系统监控权限</text>
          </view>
        </view>
      </view>
    </view>

    <BottomNav active="admin" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import BottomNav from '@/components/BottomNav.vue';
import AppIcon from '@/components/AppIcon.vue';
import { monitorAdminModules, systemAdminModules } from '@/utils/admin';
import { navigate, routes } from '@/utils/navigation';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { handlePageError } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

const sessionStore = useSessionStore();

const systemModules = computed(() => systemAdminModules.filter((item) => sessionStore.permissions.includes(item.permission)));
const monitorModules = computed(() => monitorAdminModules.filter((item) => sessionStore.permissions.includes(item.permission)));

onShow(() => {
  if (!ensureAuthenticated()) {
    return;
  }
  void sessionStore.loadSession().catch(async (error) => {
    await handlePageError(error, '管理台加载失败');
    uni.reLaunch({ url: routes.login });
  });
});
</script>

<style lang="scss">
@import './index.scss';
</style>
