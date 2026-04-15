<template>
  <slot />
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import uni, { getCurrentPagesSafe } from '@/utils/uni';
import { routes } from '@/utils/navigation';

const publicRoutes = new Set<string>([routes.login]);

const normalizeRoute = (value: unknown) => {
  const route = typeof value === 'string' ? value.trim() : '';
  if (!route) {
    return '';
  }
  const normalized = route.startsWith('/') ? route : `/${route}`;
  const queryIndex = normalized.indexOf('?');
  return queryIndex >= 0 ? normalized.slice(0, queryIndex) : normalized;
};

const resolveCurrentRoute = () => {
  const pages = getCurrentPagesSafe();
  const current = pages[pages.length - 1] as { route?: string } | undefined;
  return normalizeRoute(current?.route);
};

const hasToken = () => Boolean(uni.getStorageSync('Admin-Token'));

onShow(() => {
  const currentRoute = resolveCurrentRoute();
  if (!currentRoute || publicRoutes.has(currentRoute) || hasToken()) {
    return;
  }
  uni.reLaunch({ url: routes.login });
});
</script>

<style lang="scss">
page {
  background: #f5f7f9;
}
</style>
