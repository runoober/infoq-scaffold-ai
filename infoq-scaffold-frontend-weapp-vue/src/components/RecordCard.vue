<template>
  <view :class="['record-card-modern', className]" @click="$emit('click')">
    <view v-if="statusColor" class="status-accent" :style="{ backgroundColor: statusColor }" />
    <view class="record-header">
      <view class="title-wrapper">
        <view class="title-icon-box">
          <slot name="icon">
            <AppIcon :name="icon || 'file-generic'" :size="36" color="#1677ff" />
          </slot>
        </view>
        <text class="title-text">{{ title }}</text>
      </view>
      <view class="extra-wrapper">
        <slot name="extra">{{ extra }}</slot>
      </view>
    </view>
    
    <view class="record-card-body-content">
      <slot></slot>
    </view>
    
    <view v-if="actions && actions.length > 0" class="record-footer">
      <view
        v-for="item in actions"
        :key="item.title"
        :class="['footer-action-btn', item.danger ? 'danger' : '', item.primary ? 'primary' : '', item.disabled ? 'disabled' : '']"
        @click.stop="!item.disabled && item.onClick()"
      >
        {{ item.title }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue';

defineProps<{
  title: string;
  icon?: string;
  extra?: string;
  statusColor?: string;
  actions?: Array<{
    title: string;
    onClick: () => void;
    danger?: boolean;
    primary?: boolean;
    disabled?: boolean;
  }>;
  className?: string;
}>();

defineEmits(['click']);
</script>
