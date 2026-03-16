# Priority Matrix

## P0 (must first)

- `src/utils/validate.ts`
- `src/utils/scaffold.ts`
- `src/utils/request.ts`
- `src/utils/auth.ts`
- `src/utils/dict.ts`
- `src/utils/permission.ts`
- `src/store/modules/user.ts`
- `src/store/modules/permission.ts`
- `src/store/modules/tagsView.ts`
- `src/store/modules/dict.ts`
- `src/plugins/auth.ts`
- `src/plugins/cache.ts`
- `src/directive/common/copyText.ts`
- `src/directive/permission/index.ts`

## P1

- `src/utils/sse.ts`
- `src/utils/websocket.ts`
- `src/plugins/download.ts`
- `src/plugins/tab.ts`
- `src/plugins/modal.ts`
- `src/permission.ts`
- `src/router/index.ts`

## P2

- Common components: `Pagination`, `RightToolbar`, `DictTag`, `IconSelect`, `Breadcrumb`
- Lightweight views first: `views/error/401`, `views/error/404`, `views/redirect`, `views/index`
- Then medium business views: `system/user/authRole`, `system/role/authUser`, `system/role/selectUser`, `system/user/profile/*`

## P3

- Heavy business views: `system/user/index`, `system/role/index`, `system/menu/index`, `system/dept/index`, `system/dict/*`, `monitor/*`
- Prioritize one representative page per domain, stabilize stubs/mocks, then replicate pattern.

### P3 Progress Snapshot (2026-03-07)

- Done:
  - `system/menu/index.vue`
  - `system/user/index.vue`
  - `system/role/index.vue`
  - `system/dept/index.vue`
  - `system/dict/index.vue`
  - `system/dict/data.vue`
  - `system/post/index.vue`
  - `system/notice/index.vue`
  - `system/config/index.vue`
  - `system/client/index.vue`
  - `system/oss/index.vue`
  - `system/oss/config.vue`
  - `monitor/online/index.vue`
  - `monitor/loginInfo/index.vue`
  - `monitor/cache/index.vue`
  - `monitor/operLog/index.vue`
  - `monitor/operLog/oper-info-dialog.vue`
- Remaining high-impact gaps:
  - Rich media/editor wrappers: `components/Editor`, `components/FileUpload`, `components/ImageUpload`
  - Selector-heavy reusable business components: `components/RoleSelect`, `components/UserSelect`

## Definition of Done per file

- Happy path + core error path
- Edge branch at least one assertion
- Side effects validated (`store mutation`, `notification`, `redirect`, `download`, etc.)
- Runtime-dependent directives/properties handled (`v-loading`, `v-hasPermi`, `proxy.animate`, named slots, table scoped slots)
