<template>
  <view class="empty-notice-container">
    <view class="empty-icon-wrapper">
      <AppIcon name="alert-circle" size="96" color="#bfbfbf" />
    </view>
    <view class="empty-text">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue';
defineProps<{ message: string }>();
</script>

<style scoped lang="scss">
.empty-notice-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;

  .empty-icon-wrapper {
    margin-bottom: 32rpx;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 28rpx;
    color: #94a3b8;
    text-align: center;
  }
}
</style>
