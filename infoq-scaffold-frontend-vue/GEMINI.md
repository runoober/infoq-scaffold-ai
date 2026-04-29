# GEMINI.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|概览:infoq-scaffold-frontend-vue 是基于 Vue 3.5 和 Element Plus 2.11 的管理后台。
|技术栈:Vue 3.5|Vue Router 4|Element Plus 2.11.x|Pinia|Vite 6|Vitest|Vue Test Utils。
|规约:布局见 `src/{views,components,api,store,router,utils,plugins}`|样式遵循根 `DESIGN.md` 与 `src/assets/styles/`|`src/api`/`src/plugins`/`src/router`/`src/utils/request*` 改动必须补 targeted Vitest。
|安全:VITE_APP_ENCRYPT=true 时需提供 RSA 公私钥。
|技能:组件 API=infoq-element-plus-component-reference|运行态=infoq-vue-runtime-verification|单测=infoq-vue-unit-test-patterns。
|命令:install=pnpm install|dev=pnpm run dev|test=pnpm run test:unit|coverage=pnpm run test:unit:coverage|lint=pnpm run lint:eslint|lint:fix=pnpm run lint:eslint:fix|build=pnpm run build:prod。
