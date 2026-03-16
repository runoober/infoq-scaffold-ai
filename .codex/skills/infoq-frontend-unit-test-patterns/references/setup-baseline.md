# Setup Baseline (infoq-scaffold-frontend-vue)

## Required Files

- `vitest.config.ts`
- `tests/setup.ts`
- `.env.test`
- `tests/**/*.test.ts`

## vitest.config.ts Essentials

- `environment: 'jsdom'`
- `setupFiles: ['./tests/setup.ts']`
- `globals: true`
- `css: false`
- Alias: `@ -> ./src`
- Auto imports for runtime compile:
  - `vue`
  - `pinia`
  - `@vueuse/core`
  - `vue-router`
  - `element-plus/es`: `ElMessage`, `ElMessageBox`, `ElNotification`, `ElLoading`

## setup.ts Essentials

- Mock `element-plus/es`
- Mock `element-plus` (for modules importing from root package path)
- Define memory `localStorage` and `sessionStorage` at top-level (before tests import modules)
- Polyfill:
  - `window.matchMedia`
  - `ResizeObserver`
  - `document.execCommand`
- Clear mocks/storage in `afterEach`

## package.json Scripts

```json
{
  "test:unit": "vitest --config vitest.config.ts --run",
  "test:unit:watch": "vitest --config vitest.config.ts",
  "test:unit:coverage": "vitest --config vitest.config.ts --run --coverage"
}
```
