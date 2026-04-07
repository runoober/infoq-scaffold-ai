# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|Scope:本文件适用于 `infoq-scaffold-frontend-vue` 及其子目录，用于把根规则收窄到 Vue admin 语境。
|Stack:Vue 3|TypeScript|Vite 6|Element Plus 2.x|Pinia|Vue Router 4|Vitest
|Workspace Layout:src/views|src/components|src/api|src/store|src/router|src/utils|src/plugins|tests
|Package And Formatting:默认使用 pnpm。|遵循本地 eslint 与 prettier 配置，前端使用 2-space formatting。|source、env、test files 保持 UTF-8。
|Commands:install=cd infoq-scaffold-frontend-vue && pnpm install|dev=cd infoq-scaffold-frontend-vue && pnpm run dev|test=cd infoq-scaffold-frontend-vue && pnpm run test:unit|coverage=cd infoq-scaffold-frontend-vue && pnpm run test:unit:coverage|lint=cd infoq-scaffold-frontend-vue && pnpm run lint:eslint:fix|build=cd infoq-scaffold-frontend-vue && pnpm run build:prod
|OpenSpec Routing:凡是影响 Vue code 的新功能、行为变更或跨工作区交付，编码前先创建或定位 `openspec/changes/<change-id>/`。|实现与验证以 `proposal.md`、`tasks.md`、`design.md` 为准。
|Component Boundary:优先使用 Element Plus 和现有 Vue patterns，再考虑自定义组件。|组件 API 或版本支持检查使用 element-plus-component-reference。|本工作区不要套用 React 或 Ant Design 规则。
|Testing Boundary:Vue 单测与 coverage 工作使用 infoq-vue-unit-test-patterns。|优先 deterministic Vitest + Vue Test Utils 断言，并 mock Element Plus、router、storage、env 依赖。|扩展 shared utils/store/request/permission 路径或用户明确要求 coverage 时运行 coverage。
|Verification:Vue 行为变更先验证 main flow，再根据影响范围跑 targeted 或 full unit tests，然后 lint，最后 production build。|渲染流程如 `/login` 或 shared views 受影响时使用 infoq-vue-browser-automation 做 runtime UI smoke。|本地 Vue 栈需要启动或重启时使用 infoq-vue-run-dev-stack。
|Boundaries:Vue 专属规则只留在本工作区；React command、Antd API、Testing Library 模式归 `infoq-scaffold-frontend-react`。
