# GEMINI.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|概览:infoq-scaffold-frontend-react 是基于 React 19 和 Ant Design 6 的管理后台。
|技术栈:React 19|React Router 7|Ant Design 6|Zustand|Vite 7|Vitest|Testing Library。
|规约:布局见 `src/{pages,components,api,store,router,utils,hooks}`|样式遵循根 `DESIGN.md` 与 `src/styles/index.scss`|`src/api`/`src/router`/`src/store`/`src/utils/request*` 改动必须补 targeted Vitest。
|安全:VITE_APP_ENCRYPT=true 时需提供 RSA 公私钥。
|技能:组件 API=infoq-ant-design-component-reference|运行态=infoq-react-runtime-verification|单测=infoq-react-unit-test-patterns。
|命令:install=pnpm install|dev=pnpm run dev|test=pnpm run test|coverage=pnpm run test:coverage|lint=pnpm run lint|lint:fix=pnpm run lint:fix|build=pnpm run build:prod。
