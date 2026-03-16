import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_APP_PROXY_TARGET || 'http://localhost:8080';

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
