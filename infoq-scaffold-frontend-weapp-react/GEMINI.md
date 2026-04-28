# GEMINI.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|概览:infoq-scaffold-frontend-weapp-react 是基于 Taro 4 和 React 18 的微信小程序。
|技术栈:Taro 4|React 18|Zustand|Vitest|Taro Test Helpers。
|小程序规约:严禁硬编码 `TARO_APP_ID`|AppID 与 API origin 仅能存放在 `.env.*`|交付前检查 `script/build-open-wechat-devtools.mjs`。
|错误规约:request.ts 必须提取 `errMsg/message/msg`|禁止出现 `[object Object]`。
|测试:test:e2e:weapp:core 为无后端稳定模式|运行态验证优先使用 infoq-react-runtime-verification。
|命令:install=pnpm install|dev=pnpm run dev:weapp|open=pnpm --dir . build-open:weapp:dev|test=pnpm run test。
