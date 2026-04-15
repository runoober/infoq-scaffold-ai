<template>
  <view :class="['status-tag-modern', type || 'info']">
    {{ label }}
  </view>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}>();
</script>
