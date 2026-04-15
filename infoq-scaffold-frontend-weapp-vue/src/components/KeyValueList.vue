<template>
  <view class="record-body">
    <view v-for="item in items" :key="item.label" class="kv-item">
      <text class="kv-label">{{ item.label }}</text>
      <view class="kv-value">
        <slot :name="'value-' + item.label" :item="item">
          {{ item.value }}
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; value: any }>;
}>();
</script>
