import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * 如果是后端Docker部署，前端填写后端Docker名称加端口
 * 例如：'http://infoq-scaffold-backend:8080'
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_APP_PROXY_TARGET || 'http://localhost:8080';

  const reactVendorPackages = [
    'react',
    'react-dom',
    'react-router-dom',
    'scheduler',
    '@remix-run/router',
    'react-easy-crop',
    '@ant-design/icons',
    '@ant-design/icons-svg',
    '@ant-design/colors',
    '@ant-design/fast-color',
    '@babel/runtime',
    'tslib',
    'i18next',
    'react-i18next',
    '@rc-component/util',
    '@rc-component/motion',
    '@rc-component/overflow',
    '@rc-component/portal',
    '@rc-component/resize-observer',
    '@rc-component/trigger'
  ];
  const sharedVendorPackages = [
    'axios',
    'crypto-js',
    'dayjs',
    'file-saver',
    'jsencrypt',
    'nprogress',
    'zustand'
  ];
  const echartsVendorPackages = ['echarts'];
  const antdChunkRules = [
    {
      chunk: 'vendor-antd-locale',
      prefixes: [
        'antd/es/locale',
        'antd/lib/locale',
        'antd/es/modal/locale',
        'antd/lib/modal/locale',
        'antd/es/calendar/locale',
        'antd/lib/calendar/locale',
        'antd/es/date-picker/locale',
        'antd/lib/date-picker/locale',
        'antd/es/time-picker/locale',
        'antd/lib/time-picker/locale',
        '@rc-component/picker/es/locale',
        '@rc-component/picker/lib/locale',
        '@rc-component/pagination/es/locale',
        '@rc-component/pagination/lib/locale'
      ]
    },
    {
      chunk: 'vendor-antd-color',
      prefixes: [
        '@rc-component/color-picker',
        'antd/es/color-picker/color',
        'antd/lib/color-picker/color',
        'antd/es/color-picker/util',
        'antd/lib/color-picker/util'
      ]
    },
    { chunk: 'vendor-antd-table', prefixes: ['antd/es/table', 'antd/lib/table'] },
    { chunk: 'vendor-antd-result', prefixes: ['antd/es/result', 'antd/lib/result'] },
    {
      chunk: 'vendor-antd-core',
      prefixes: [
        'antd/es/_util',
        'antd/lib/_util',
        'antd/es/config-provider',
        'antd/lib/config-provider',
        'antd/es/style',
        'antd/lib/style',
        'antd/es/theme',
        'antd/lib/theme',
        'antd/es/space',
        'antd/lib/space',
        'antd/es/button',
        'antd/lib/button',
        'antd/es/empty',
        'antd/lib/empty',
        'antd/es/popover',
        'antd/lib/popover',
        'antd/es/divider',
        'antd/lib/divider',
        'antd/es/tooltip',
        'antd/lib/tooltip',
        'antd/es/color-picker/components/ColorPresets',
        'antd/lib/color-picker/components/ColorPresets',
        'antd/es/input/style',
        'antd/lib/input/style',
        'antd/es/input-number/style',
        'antd/lib/input-number/style',
        'antd/es/version',
        'antd/lib/version'
      ]
    },
    {
      chunk: 'vendor-antd-picker',
      prefixes: [
        'antd/es/date-picker',
        'antd/lib/date-picker',
        'antd/es/time-picker',
        'antd/lib/time-picker',
        'antd/es/color-picker',
        'antd/lib/color-picker',
        '@rc-component/picker'
      ]
    },
    {
      chunk: 'vendor-antd-form',
      prefixes: [
        'antd/es/input',
        'antd/lib/input',
        'antd/es/input-number',
        'antd/lib/input-number'
      ]
    }
  ] as const;

  const matchesNodeModulePackage = (id: string, packages: readonly string[]) => {
    return packages.some((pkg) => id.includes(`/node_modules/${pkg}/`) || id.includes(`/node_modules/${pkg}`));
  };

  const getManualChunkName = (id: string) => {
    for (const rule of antdChunkRules) {
      if (matchesNodeModulePackage(id, rule.prefixes)) {
        return rule.chunk;
      }
    }

    return undefined;
  };

  return {
    base: env.VITE_APP_CONTEXT_PATH || '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_APP_PORT || 80),
      open: true,
      proxy: {
        [env.VITE_APP_BASE_API]: {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
          rewrite: (urlPath) => urlPath.replace(new RegExp('^' + env.VITE_APP_BASE_API), '')
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }
            if (matchesNodeModulePackage(id, echartsVendorPackages)) {
              return 'vendor-echarts';
            }
            if (matchesNodeModulePackage(id, reactVendorPackages)) {
              return 'vendor-react';
            }
            if (matchesNodeModulePackage(id, sharedVendorPackages)) {
              return 'vendor-shared';
            }
            const manualChunkName = getManualChunkName(id);
            if (manualChunkName) {
              return manualChunkName;
            }
          }
        }
      }
    },
    test: {
      name: 'infoq-scaffold-frontend-react-unit',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
      exclude: ['node_modules', 'dist', 'coverage'],
      mockReset: true,
      clearMocks: true,
      restoreMocks: true,
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/types/**/*.d.ts'],
        thresholds: {
          lines: 1,
          functions: 1,
          branches: 1,
          statements: 1
        }
      }
    }
  };
});
