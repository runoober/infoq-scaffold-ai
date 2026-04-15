<template>
  <view v-if="total > pageSize" class="pagination-wrapper" style="padding: 32rpx; display: flex; align-items: center; justify-content: center; gap: 24rpx">
    <button 
      class="secondary-btn" 
      style="margin: 0; min-width: 140rpx" 
      :disabled="current <= 1"
      @click="$emit('change', current - 1)"
    >上一页</button>
    <text style="font-size: 28rpx; color: #595959">{{ current }} / {{ Math.ceil(total / pageSize) }}</text>
    <button 
      class="secondary-btn" 
      style="margin: 0; min-width: 140rpx" 
      :disabled="current >= Math.ceil(total / pageSize)"
      @click="$emit('change', current + 1)"
    >下一页</button>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  current: number;
  pageSize: number;
  total: number;
}>();

defineEmits<{
  (e: 'change', page: number): void;
}>();
</script>
