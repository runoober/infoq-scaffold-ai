---
name: infoq-frontend-unit-test-patterns
description: Build and scale frontend unit tests for infoq-scaffold-frontend-vue (Vue3 + Vite6 + TypeScript) using Vitest, Vue Test Utils, jsdom, deterministic mocks for Element Plus/router/storage/env, priority-first coverage expansion (utils/store/request/permission first), and strict validation with test+coverage+lint+build. Use when users request frontend unit tests, 前端单元测试全覆盖, coverage backfill, regression tests, or bug-fix-through-tests in infoq-scaffold-frontend-vue.
---

# Infoq Frontend Unit Test Patterns

## Scope

Use this skill for `infoq-scaffold-frontend-vue` test coverage expansion and regression-proof refactors.
Primary targets in order: `src/utils` -> `src/store` -> `src/plugins` -> `src/directive` -> `src/router`/`src/permission` -> `src/components` -> `src/views`.

Current baseline (2026-03-07):
- `pnpm run test:unit` => `77 files / 218 tests` all passed
- `pnpm run test:unit:coverage` => overall lines `82.98%`
- Full gate (`test + coverage + lint + build`) passed

Package manager rule:
- Prefer `pnpm` for all frontend validation commands.
- If `pnpm` is unavailable in the current environment, use the equivalent `npm` commands.

## Workflow

1. Bootstrap test infra if missing: `vitest.config.ts`, `tests/setup.ts`, `.env.test`, npm scripts.
1. Bootstrap test infra if missing: `vitest.config.ts`, `tests/setup.ts`, `.env.test`, pnpm scripts.
2. Keep test env deterministic: mock `element-plus/es`, memory `localStorage/sessionStorage`, browser polyfills (`matchMedia`, `ResizeObserver`, `execCommand`).
3. Add tests by priority:
   - P0: `validate/scaffold/request/user-store/permission-store/tagsView/dict/cache/auth/directive`
   - P1: `sse/websocket/download/tab/modal/router-guard`
   - P2: reusable components (`Pagination/RightToolbar/DictTag/IconSelect/Breadcrumb`) and lightweight views (`error pages/redirect/home`) before heavy business pages.
   - P3: medium business pages (`system/user/authRole`, `system/role/authUser`, `system/role/selectUser`, `system/user/profile/*`) before super-heavy CRUD pages (`system/user/index`, `system/role/index`, `system/menu/index`, etc.).
4. Run targeted tests first, then full unit suite.
5. If tests expose business bugs, patch source immediately and add regression assertions.
6. Run full validation gate: unit tests + coverage + lint + build.
7. Run frontend smoke verification on `/login` with browser automation and console error check.

## Guardrails

- Prefer behavior assertions over implementation details.
- For interceptor/store tests, assert branch outcomes (headers, redirects, errors, state mutations), not private internals.
- Keep network deterministic via `vi.mock` or adapter stubs.
- Do not weaken assertions, broaden mocks, mute warnings, raise thresholds, or add fake-success paths merely to make tests/build pass; fix the real issue or stop and document a user-approved exception.
- If a source or test change is identified as wrong, revert the incorrect code immediately before continuing and do not leave dead, unreachable, or uncalled code behind.
- Use low-friction route objects for store tests (`as RouteLocationNormalized`) to focus on business behavior.
- For unstable browser APIs in jsdom, use setup polyfills, not per-test hacks.
- For auto-imported UI APIs, mock both `element-plus/es` and `element-plus` to avoid mixed import path drift in source files.
- For module-level singleton state (`sse.ts`), always call teardown API (`closeSSE`) in `beforeEach/afterEach` to prevent cross-test pollution.
- For template directives not available in test runtime (`v-loading`, `v-hasPermi`), register no-op `global.directives` stubs to keep focus on business behavior.
- For pages using `proxy?.animate.searchAnimate.*`, inject `animate` into `global.config.globalProperties` to avoid render-time `undefined`.
- For container components that depend on named slots (`el-card` header/footer), use custom stubs that render `slots.header`/`slots.footer`, not generic passthrough-only stubs.
- For table-heavy pages, pair `ElTable` + `ElTableColumn` custom stubs via `provide/inject` so scoped slot payloads (`scope.row`, `scope.$index`) are always defined.
- For table column slots touching optional fields (example: `scope.row.fileSuffix.toLowerCase()`), ensure fallback row in `ElTableColumn` stub includes those fields to avoid false negatives from empty-first-render crashes.
- For third-party local imports like `VueCropper`, prefer `vi.mock('vue-cropper', ...)` module-level replacement; global stubs may not override locally imported bindings.
- For chart pages (`echarts.init`), mock `echarts` module directly and assert `setOption`/`resize` calls instead of snapshotting canvas output.
- For parent-child ref calls (`operInfoDialogRef.value.openDialog(...)`), stub child component with `defineComponent + expose(...)` and assert exposed method calls.

## Known Project Pitfalls

- `useStorage` access during module import can fail unless storage is initialized in `tests/setup.ts` top-level.
- Element Plus resolver may import css during tests; prefer explicit auto-import mapping in `vitest.config.ts` and `test.css=false`.
- `utils/scaffold.ts` `sprintf` historically had placeholder substitution bug; keep regression test.
- `store/modules/user.ts` must expose state fields used by tests/business (e.g. `name`).
- `utils/websocket.ts` should ignore heartbeat frames (`ping`) with `indexOf('ping') >= 0`; keep regression test for literal `ping`.
- `utils/sse.ts` calls `getToken()` in both pre-check and URL builder; in tests, prefer token variable + `mockImplementation` over fragile call-order `mockReturnValueOnce`.
- `hooks/useDialog.ts` must guard optional params (`ops?.title`) to avoid runtime error when called without args.
- `utils/dynamicTitle.ts` should avoid producing literal `'undefined'` in document title when env/default title is absent.
- `components/Pagination` size-change should emit corrected `page=1` when total overflow triggers reset.
- `views/login.vue` rememberMe parser should use explicit string compare (`rememberMe === 'true'`), not `Boolean(string)`.
- For `@click.prevent` handlers in SFC tests, button stubs must emit the native event object (`emit('click', e)`), otherwise event modifier guard throws.
- `authUser/selectUser/authRole` pages require stronger table stubs: if scoped slot payload is missing, Vue will crash on `scope.row.xxx` access during mount.
- `views/system/menu/index.vue`: cascade delete empty-selection guard must use `menuIds.length <= 0` (not `< 0`), otherwise warning branch never executes.
- `views/monitor/operLog/index.vue`: call the imported APIs with exact names `delOperLog` / `cleanOperLog`; misspelled `delOperlog` / `cleanOperlog` causes runtime `ReferenceError`.

## Finish Criteria

All must pass:

```bash
cd infoq-scaffold-frontend-vue
pnpm run test:unit
pnpm run test:unit:coverage
pnpm run lint:eslint:fix
pnpm run build:prod
```

## References

- Commands: `references/commands.md`
- Setup baseline: `references/setup-baseline.md`
- Priority matrix: `references/priority-matrix.md`
- Mock patterns: `references/mock-patterns.md`
