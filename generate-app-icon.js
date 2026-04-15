const fs = require('fs');

const svgMap = {
  'add': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19M5 12H19" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'user': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12ZM12 14C6.66667 14 2 16.6667 2 22L22 22C22 16.6667 17.3333 14 12 14Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'bookmark': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21L12 17L5 21V5Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'folder': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7L3 5C3 3.89543 3.89543 3 5 3H9L11 5H19C20.1046 5 21 3.89543 21 5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'calendar': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2V4M16 2V4M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V6C3 4.89543 3.89543 4 5 4Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'menu': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H24M4 18H20" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'message': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10H16M8 14H12M21 15C21 16.1046 20.1046 17 19 17H7L3 21V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'file-generic': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3H15C15.2652 3 15.5196 3.10536 15.7071 3.29289L19.7071 7.29289C19.8946 7.48043 20 7.73478 20 8L20 21C20 22.1046 19.1046 23 18 23H7C5.89543 23 5 22.1046 5 21V5C5 3.89543 5.89543 3 7 3ZM14 3V8H19" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'eye': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12C1 12 10 4 12 4C14 4 23 12 23 12C23 12 14 20 12 20C10 20 1 12 1 12ZM12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'list': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 6H19M8 12H19M8 18H19M4 6H4.01M4 12H4.01M4 18H4.01" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'settings': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15ZM20 12C19.6558 12 19.3259 11.9429 19.0243 11.8357L18.7067 10.5192C18.8258 9.72698 19.1051 9.0776 19.3785 8.56506L17.565 6.7515C17.0524 7.02491 16.403 7.30423 15.6108 7.42336L14.2943 7.1057C14.1871 6.80406 14.13 6.4742 14.13 6.13L14.13 3.57L11.87 3.57L11.87 6.13C11.87 6.4742 11.8129 6.80406 11.7057 7.1057L10.3892 7.42336C9.597 7.30423 8.9476 7.02491 8.43506 6.7515L6.6215 8.56506C6.89491 9.0776 7.17423 9.72698 7.29336 10.5192L6.9757 11.8357C6.67406 11.9429 6.3442 12 6 12L6 14.13C6.3442 14.13 6.67406 14.1871 6.9757 14.2943L7.29336 15.6108C7.17423 16.403 6.89491 17.0524 6.6215 17.565L8.43506 19.3787C8.9476 19.1051 9.597 18.8258 10.3892 18.7067L11.7057 19.0243C11.8129 19.3259 11.87 19.6558 11.87 20L11.87 22.43L14.13 22.43L14.13 20C14.13 19.6558 14.1871 19.3259 14.2943 19.0243L15.6108 18.7067C16.403 18.8258 17.0524 19.1051 17.565 19.3787L19.3785 17.565L19.165 17.0524C18.8258 16.403 18.8258 15.6108 18.7067 15.6108L19.0243 14.2943C19.3259 14.1871 19.6558 14.13 20 12L20 12Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'home': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2,21 9V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V9Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22V12H15V22" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'bullet-list': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 6H21M8 12H21M8 18H21M4 6H4.01M4 12H4.01M4 18H4.01" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'chevron-right': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5L16 12L9 19" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'check': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'tag': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 7H7.01M2 12L12 2L22 12L12 22L2 12Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'trash': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6H5M5 6H19M5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M9 11V17M15 11V17" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'camera': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V5C1 3.89543 1.89543 3 3 3H7L10 1H14L17 3H21C22.1046 3 23 3.89543 23 5V19ZM12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'alert-circle': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12M12 16H12.01M22 12C22 17.5239 17.5239 22 12 22C6.47614 22 2 17.5239 2 12C2 6.47614 6.47614 2 12 2C17.5239 2 22 6.47614 22 12Z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'volume-plus': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 5L2 9V15L11 19V5ZM15 9V15M18 6V18M21 3v18" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'sun': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'moon': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'info': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8h.01M12 12v4M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

const vueContent = `<template>
  <image 
    class="app-icon" 
    :src="iconData"
    :style="{
      width: size + 'rpx',
      height: size + 'rpx'
    }"
  ></image>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  name: string;
  size?: number | string;
  color?: string;
}>(), {
  size: 32,
  color: 'currentColor' // Note: fallback if not provided, but usually explicitly provided.
});

// Avoid using URLSearchParams or btoa as they might not be fully supported in all MP environments without polyfill,
// but encodeURIComponent works fine for SVG data URIs.
const svgs: Record<string, string> = ${JSON.stringify(svgMap, null, 2)};

// Aliases for better compatibility with admin module keys
const iconAliases: Record<string, string> = {
  'users': 'user',
  'roles': 'bookmark',
  'depts': 'folder',
  'posts': 'calendar',
  'menus': 'menu',
  'notices': 'message',
  'online': 'eye',
  'loginInfo': 'file-generic',
  'operLog': 'list',
  'cache': 'settings',
  'dicts': 'list',
  'volume': 'volume-plus'
};

const iconData = computed(() => {
  const targetName = iconAliases[props.name] || props.name;
  let svgStr = svgs[targetName] || svgs['file-generic'];
  
  // Replace COLOR placeholder with actual color
  const safeColor = props.color === 'currentColor' ? '#000000' : props.color;
  svgStr = svgStr.replace(/COLOR/g, safeColor);
  
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgStr);
});
</script>

<style scoped lang="scss">
.app-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
`;

fs.writeFileSync('infoq-scaffold-frontend-weapp-vue/src/components/AppIcon.vue', vueContent);
console.log('Generated AppIcon.vue with data URL approach');
