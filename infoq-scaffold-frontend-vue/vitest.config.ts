import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';

export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      AutoImport({
        imports: [
          'vue',
          'pinia',
          '@vueuse/core',
          'vue-router',
          {
            'element-plus/es': ['ElMessage', 'ElMessageBox', 'ElNotification', 'ElLoading']
          }
        ],
        dts: false
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    test: {
      name: 'infoq-scaffold-frontend-vue-unit',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.ts'],
      exclude: ['node_modules', 'dist', 'coverage'],
      mockReset: true,
      clearMocks: true,
      restoreMocks: true,
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx,vue}'],
        exclude: ['src/main.ts', 'src/assets/**', 'src/types/**/*.d.ts', 'src/**/index.ts', 'src/router/routes.ts']
      }
    }
  };
});
