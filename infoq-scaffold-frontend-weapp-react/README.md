# InfoQ Weapp React Workspace

This workspace hosts the Taro + React mini-program frontend for the scaffold.

## Layout

- `src/api`: API contracts and request wrappers
- `src/utils`: runtime helpers (auth/env/errors/formatting/theme)
- `src/pages`: page entries for H5 and WeChat mini-program targets
- `src/styles`: shared mobile styles
- `patches/jsencrypt@3.5.4.patch`: project-local runtime compatibility patch for `jsencrypt`

## Phase-One Scope

- login and logout
- workbench home
- notice list, detail, create, edit, delete
- profile info update and avatar upload
- shared H5 and WeChat mini-program build targets

## Deliberate Exclusions

- notification center
- SSE
- WebSocket
- timed polling for notifications

## Local Test Workflow

- Run `pnpm test` for deterministic unit tests (Vitest).
- Run `pnpm run test:coverage` for coverage report (`coverage/` output).
- Run `pnpm run test:watch` for watch mode during local development.
- Run `pnpm run test:e2e:weapp` (alias of `test:e2e:weapp:smoke`) for fast route smoke checks.
- Run `pnpm run test:e2e:weapp:core` for core auth/profile/notice/permission checks.
- Run `pnpm run test:e2e:weapp:full` for full checks plus report output in `tests/e2e/weapp/reports/` (includes API contract smoke + all-route smoke + captured WeChat DevTools console logs).
- Run `pnpm run verify:local` for one-command local regression (`test -> build:weapp:dev -> weapp core -> build:weapp`).
- `full` suite is strict: any skipped case is treated as failure.

### WeChat E2E Env Vars

- `WECHAT_DEVTOOLS_CLI`: full path to WeChat DevTools CLI. If omitted, the script tries common macOS locations first.
- `WECHAT_DEVTOOLS_URL_CHECK` (optional): legal-domain validation toggle synced before e2e launch. Default `false` (equivalent to enabling `不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书`); set `true` to keep validation enabled.
- `WEAPP_E2E_SUITE` (optional): default suite when running `tests/e2e/weapp/runner.mjs` directly (`smoke`, `core`, `full`).
- `WEAPP_E2E_REPORT` (optional): enable report output (`1/true/yes/on`).
- `WEAPP_E2E_REPORT_DIR` (optional): report output directory, default `tests/e2e/weapp/reports`.
- `WEAPP_E2E_TOKEN` (optional): when provided, full/core checks validate authenticated route staying behavior.
- `WEAPP_E2E_AUTO_LOGIN` (optional): enable backend API auto-login when `WEAPP_E2E_TOKEN` is empty. Default `true`.
- `WEAPP_E2E_AUTO_LOGIN_USERNAME` / `WEAPP_E2E_AUTO_LOGIN_PASSWORD` (optional): preferred credentials for auto-login.
- `WEAPP_E2E_AUTO_LOGIN_CANDIDATES` (optional): fallback account list, default `admin:admin123,dept:666666,owner:666666,admin:123456`.
- `WEAPP_E2E_BASE_URL` (optional): explicit backend base URL for auto-login.
- `WEAPP_E2E_API_ORIGIN` / `WEAPP_E2E_MINI_BASE_API` (optional): override auto-login backend origin/base path resolution.
- `WEAPP_E2E_CLIENT_ID` / `WEAPP_E2E_RSA_PUBLIC_KEY` (optional): override login encryption parameters for auto-login.
- `WEAPP_E2E_KEEP_EXISTING_SESSION` (optional): when enabled and `WEAPP_E2E_TOKEN` is empty, runner keeps the current mini-program storage token and skips token clear/set. Use this after you manually log in once, so smoke does not require captcha interaction.
- When `WEAPP_E2E_AUTO_LOGIN=false` and both `WEAPP_E2E_TOKEN` / `WEAPP_E2E_KEEP_EXISTING_SESSION` are omitted, unauthenticated checks assert fallback to public entry routes (`/pages/login/index` or `/pages/home/index`).
- `WEAPP_E2E_EXTRA_ROUTES` (optional): comma-separated route list, for example `/pages/notices/index,/pages/system-users/index`.
- `WEAPP_E2E_STRICT_SELECTOR` (optional): when enabled, selector assertion failures become hard failures; default is non-blocking.
- `WEAPP_E2E_FAIL_ON_CONSOLE_ERROR` (optional): when enabled, any captured console `error` / runtime exception fails the run; default `true`.
- `WEAPP_E2E_PROJECT_PATH` (optional): mini-program build output directory, default `dist`.
- `WEAPP_E2E_STEP_WAIT_MS` (optional): wait time after each route relaunch, default `900`.
- `WEAPP_E2E_TIMEOUT_MS` (optional): automator launch timeout, default `120000`.

### WeChat E2E Failure Rules

- If WeChat DevTools CLI is missing, smoke script fails explicitly.
- If `dist/project.config.json` is missing, smoke script fails explicitly.
- If suite id or CLI arguments are unsupported, runner fails explicitly.
- If `WEAPP_E2E_TOKEN` is set but route still falls back to unauthenticated public entry, smoke script fails explicitly.
- If auto-login sees `/auth/code` -> `captchaEnabled=true`, runner fails explicitly and requires temporary backend override `--captcha.enable=false`.
- If DevTools runtime emits console `error` / exception, runner fails explicitly by default.

## Local WeChat DevTools Workflow

- Ensure WeChat DevTools is installed locally and its service port is enabled.
- Run `pnpm install` inside `infoq-scaffold-frontend-weapp-react/`; the install uses the project-local `patches/jsencrypt@3.5.4.patch`.
- Pass a real mini-program AppID with `--appid` or `TARO_APP_ID`; `touristappid` is only the scaffold placeholder and cannot be used by the launcher.
- Run `pnpm build-open:weapp -- --appid wx1234567890abcdef` to build the React mini-program bundle and open it in WeChat DevTools.
- Run `pnpm build-open:weapp:dev` to build the React mini-program bundle with `.env.development` and open it in WeChat DevTools.
- Run `pnpm dev:weapp` for watch-mode mini-program development builds; the command binds explicitly to `.env.development`.
- The launcher script lives at `../script/build-open-wechat-devtools.mjs` and is called through the workspace package scripts.
- The launcher script patches `dist/project.config.json` and `dist/project.private.config.json` with `setting.urlCheck=false` by default, then synchronizes matching WeChat DevTools local project settings to the same value. This is equivalent to enabling `不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书`.
- If you need to keep domain checks enabled, set `WECHAT_DEVTOOLS_URL_CHECK=true` before running `build-open:weapp` / `build-open:weapp:dev`.
- You can also export `TARO_APP_ID=wx1234567890abcdef` before running either launcher.
- Or set `TARO_APP_ID=wx1234567890abcdef` in `.env.production` / `.env.development`; the launcher reads the file that matches the selected `--mode`.
- The local scaffold defaults `TARO_APP_API_ORIGIN` to `http://localhost:8080` in `.env.production` so the simulator can talk to a local backend during `build:weapp`.
- In `.env.development`, `TARO_APP_BASE_API=/dev-api` is kept for H5 proxy use, while `TARO_APP_MINI_BASE_API=` keeps the mini-program direct backend URL as `http://localhost:8080/<api>` instead of `http://localhost:8080/dev-api/<api>`.
- For automated smoke login (no manual captcha), start backend with temporary captcha override:
  - `mvn -pl infoq-admin spring-boot:run -Dspring-boot.run.arguments=--captcha.enable=false`
  - or `java -jar infoq-admin/target/infoq-admin.jar --captcha.enable=false`
- When `TARO_APP_API_ORIGIN` points to `localhost` or `127.0.0.1`, local debugging still requires legal-domain checks to be disabled; the launcher does this automatically unless `WECHAT_DEVTOOLS_URL_CHECK=true`.
- Replace `TARO_APP_API_ORIGIN` with your real accessible backend origin before real-device debugging or deployment, and keep the WeChat legal request domain list in sync.
- `localhost` and `127.0.0.1` are not valid mini-program request domains for real-device or released use.
- The AppID must be a real mini-program AppID that is valid for the current WeChat DevTools login; otherwise the CLI will report `invalid appid`.
- If WeChat DevTools is installed in a non-standard location, set `WECHAT_DEVTOOLS_CLI` to the full CLI path before running the script.
