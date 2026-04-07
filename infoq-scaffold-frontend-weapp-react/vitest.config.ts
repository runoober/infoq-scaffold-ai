import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'infoq-mobile-core': path.resolve(__dirname, './src/mobile-core/index.ts'),
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    name: 'infoq-scaffold-frontend-weapp-react-unit',
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
      include: ['src/mobile-core/helpers.ts', 'src/mobile-core/permissions.ts', 'src/store/session.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    }
  }
});
