# GEMINI.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|概览:infoq-scaffold-frontend-weapp-vue 是基于 uni-app 3 (Vue 3) 的微信小程序。
|技术栈:uni-app 3|Vue 3|Pinia|Vitest。
|小程序规约:需在 `.env.development` 配置 `TARO_APP_ID` 运行 build-open|交付前必须运行 `pnpm run typecheck`。
|错误规约:禁止异常文案出现 `[object Object]`|request.ts 必须执行错误归一化。
|测试:E2E 默认无后端稳定模式|运行态验证优先使用 infoq-vue-runtime-verification。
|命令:install=pnpm install|dev=pnpm run dev:weapp|open=pnpm --dir . build-open:weapp:dev|typecheck=pnpm run typecheck|test=pnpm run test。
