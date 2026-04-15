<template>
  <view class="bottom-nav-modern">
    <view
      v-for="item in items"
      :key="item.key"
      class="nav-item"
      :class="{ active: item.key === active }"
      @click="go(item.url, item.key)"
    >
      <view class="nav-icon-wrapper">
        <AppIcon 
          :name="item.icon" 
          size="44" 
          :color="item.key === active ? '#1677ff' : '#94a3b8'" 
        />
      </view>
      <text class="nav-text">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { relaunch, routes } from '@/utils/navigation';
import AppIcon from '@/components/AppIcon.vue';

const props = defineProps<{ active: 'home' | 'admin' | 'profile' }>();

const items = [
  { key: 'home', label: '首页', icon: 'home', url: routes.home },
  { key: 'admin', label: '管理台', icon: 'bullet-list', url: routes.admin },
  { key: 'profile', label: '我的', icon: 'user', url: routes.profile }
] as const;

const go = (url: string, key: string) => {
  if (key !== props.active) {
    relaunch(url);
  }
};
</script>

<style scoped lang="scss">
@import '../styles/common.scss';

.bottom-nav-modern {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.03);
  z-index: 999;

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 10rpx 0;
    transition: all 0.2s ease;

    .nav-icon-wrapper {
      margin-bottom: 4rpx;
      transition: transform 0.2s ease;
    }

    .nav-text {
      font-size: 20rpx;
      color: #94a3b8;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    &.active {
      .nav-icon-wrapper {
        transform: translateY(-2rpx);
      }
      .nav-text {
        color: $primary-color;
        font-weight: 600;
      }
    }
  }
}
</style>
