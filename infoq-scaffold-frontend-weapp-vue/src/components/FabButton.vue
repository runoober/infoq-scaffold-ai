<template>
  <view class="fab-button-modern" @click="$emit('click')">
    <AppIcon name="add" :size="48" color="#fff" />
  </view>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue';

withDefaults(defineProps<{
  icon?: string;
}>(), {
  icon: 'add'
});

defineEmits<{
  (e: 'click'): void;
}>();
</script>
