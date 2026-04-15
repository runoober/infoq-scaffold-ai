# InfoQ Weapp Vue Workspace

This workspace hosts the uni-app + Vue 3 mini-program frontend for the scaffold.

## Layout

- `src/api`: API contracts and request wrappers
- `src/utils`: runtime helpers (auth/env/errors/formatting/theme)
- `src/pages`: page entries for H5 and WeChat mini-program targets
- `src/styles`: shared mobile styles
- `patches/jsencrypt@3.5.4.patch`: project-local runtime compatibility patch for `jsencrypt`

## Local Test Workflow

- Run `pnpm test` for deterministic unit tests (Vitest).
- Run `pnpm run test:coverage` for coverage report (`coverage/` output).
- Run `pnpm run test:e2e:weapp` (alias of `test:e2e:weapp:smoke`) for fast route smoke checks.
- Run `pnpm run test:e2e:weapp:core` for core auth/profile/notice/permission checks.
- Run `pnpm run test:e2e:weapp:full` for full checks plus report output in `tests/e2e/weapp/reports/`.
- Run `pnpm run verify:local` for one-command local regression (`test -> build:weapp:dev -> weapp core -> build:weapp`).

## Local WeChat DevTools Workflow

- Ensure WeChat DevTools is installed locally and its service port is enabled.
- Run `pnpm install` inside `infoq-scaffold-frontend-weapp-vue/`.
- Run `pnpm build-open:weapp -- --appid wx1234567890abcdef` to build and open in WeChat DevTools.
- Run `pnpm build-open:weapp:dev` for development mode output.
- The launcher script is `../script/build-open-wechat-devtools.mjs` with workspace-aware args.
