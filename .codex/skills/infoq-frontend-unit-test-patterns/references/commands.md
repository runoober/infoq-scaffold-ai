# Commands

Prefer `pnpm` for the commands below. If `pnpm` is unavailable in the current environment, replace them with the equivalent `npm` commands.

## Install and Bootstrap

```bash
cd infoq-scaffold-frontend-vue
pnpm install
```

## Run One Test File

```bash
cd infoq-scaffold-frontend-vue
npx vitest --config vitest.config.ts --run tests/utils/request.test.ts
```

## Run P1 Plugin/Realtime Batch

```bash
cd infoq-scaffold-frontend-vue
npx vitest --config vitest.config.ts --run \
  tests/plugins/download.test.ts \
  tests/plugins/modal.test.ts \
  tests/plugins/tab.test.ts \
  tests/utils/sse.test.ts \
  tests/utils/websocket.test.ts
```

## Run P2 Components + Lightweight Views

```bash
cd infoq-scaffold-frontend-vue
npx vitest --config vitest.config.ts --run \
  tests/components/Breadcrumb.test.ts \
  tests/components/Pagination.test.ts \
  tests/components/RightToolbar.test.ts \
  tests/components/DictTag.test.ts \
  tests/components/IconSelect.test.ts \
  tests/views/error401.test.ts \
  tests/views/error404.test.ts \
  tests/views/redirect.test.ts \
  tests/views/index.test.ts
```

## Run P3 Medium Business Views

```bash
cd infoq-scaffold-frontend-vue
npx vitest --config vitest.config.ts --run \
  tests/views/system/user/authRole.test.ts \
  tests/views/system/role/authUser.test.ts \
  tests/views/system/role/selectUser.test.ts \
  tests/views/system/user/profile/index.test.ts \
  tests/views/system/user/profile/userInfo.test.ts \
  tests/views/system/user/profile/resetPwd.test.ts \
  tests/views/system/user/profile/userAvatar.test.ts \
  tests/views/system/user/profile/onlineDevice.test.ts
```

## Run P3 Heavy System/Monitor Views (Current Main Batch)

```bash
cd infoq-scaffold-frontend-vue
npx vitest --config vitest.config.ts --run \
  tests/views/system/menu/index.test.ts \
  tests/views/system/user/index.test.ts \
  tests/views/system/notice/index.test.ts \
  tests/views/system/config/index.test.ts \
  tests/views/system/client/index.test.ts \
  tests/views/system/oss/index.test.ts \
  tests/views/system/oss/config.test.ts \
  tests/views/monitor/online/index.test.ts \
  tests/views/monitor/loginInfo/index.test.ts \
  tests/views/monitor/cache/index.test.ts \
  tests/views/monitor/operLog/index.test.ts \
  tests/views/monitor/operLog/oper-info-dialog.test.ts
```

## Frontend Smoke (Login Page + Console Errors)

```bash
# terminal A: minimal mock backend for /dev-api/auth/code
node /tmp/infoq-ui-mock-api.js

# terminal B: start ui
cd infoq-scaffold-frontend-vue
pnpm run dev -- --host 127.0.0.1 --port 5173 --strictPort

# browser automation checks:
# 1) navigate http://127.0.0.1:5173/login
# 2) wait until login form text appears
# 3) collect console errors (errorsOnly=true) => expect 0
```

## Run Full Unit Suite

```bash
cd infoq-scaffold-frontend-vue
pnpm run test:unit
```

## Run Coverage

```bash
cd infoq-scaffold-frontend-vue
pnpm run test:unit:coverage
```

## Full Quality Gate

```bash
cd infoq-scaffold-frontend-vue
pnpm run test:unit
pnpm run test:unit:coverage
pnpm run lint:eslint:fix
pnpm run build:prod
```
