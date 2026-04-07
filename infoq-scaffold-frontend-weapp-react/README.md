# InfoQ Weapp React Workspace

This workspace hosts the Taro + React mini-program frontend for the scaffold.

## Layout

- `src/mobile-core`: mobile business core kept inside the app workspace
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

## Local WeChat DevTools Workflow

- Ensure WeChat DevTools is installed locally and its service port is enabled.
- Run `pnpm install` inside `infoq-scaffold-frontend-weapp-react/`; the install uses the project-local `patches/jsencrypt@3.5.4.patch`.
- Pass a real mini-program AppID with `--appid` or `TARO_APP_ID`; `touristappid` is only the scaffold placeholder and cannot be used by the launcher.
- Run `pnpm build-open:weapp -- --appid wx1234567890abcdef` to build the React mini-program bundle and open it in WeChat DevTools.
- Run `pnpm build-open:weapp:dev` to build the React mini-program bundle with `.env.development` and open it in WeChat DevTools.
- Run `pnpm dev:weapp` for watch-mode mini-program development builds; the command binds explicitly to `.env.development`.
- The launcher script lives at `../script/build-open-wechat-devtools.mjs` and is called through the workspace package scripts.
- You can also export `TARO_APP_ID=wx1234567890abcdef` before running either launcher.
- Or set `TARO_APP_ID=wx1234567890abcdef` in `.env.production` / `.env.development`; the launcher reads the file that matches the selected `--mode`.
- The local scaffold defaults `TARO_APP_API_ORIGIN` to `http://localhost:8080` in `.env.production` so the simulator can talk to a local backend during `build:weapp`.
- In `.env.development`, `TARO_APP_BASE_API=/dev-api` is kept for H5 proxy use, while `TARO_APP_MINI_BASE_API=` keeps the mini-program direct backend URL as `http://localhost:8080/<api>` instead of `http://localhost:8080/dev-api/<api>`.
- When `TARO_APP_API_ORIGIN` points to `localhost` or `127.0.0.1`, WeChat DevTools simulator still requires `不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书` to be enabled for local debugging.
- Replace `TARO_APP_API_ORIGIN` with your real accessible backend origin before real-device debugging or deployment, and keep the WeChat legal request domain list in sync.
- `localhost` and `127.0.0.1` are not valid mini-program request domains for real-device or released use.
- The AppID must be a real mini-program AppID that is valid for the current WeChat DevTools login; otherwise the CLI will report `invalid appid`.
- If WeChat DevTools is installed in a non-standard location, set `WECHAT_DEVTOOLS_CLI` to the full CLI path before running the script.
