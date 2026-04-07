# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|Scope:本文件适用于 `infoq-scaffold-frontend-react` 及其子目录，用于把根规则收窄到 React admin 语境。
|Stack:React 19|TypeScript|Vite 7|Ant Design 6|React Router 7|Zustand|Vitest|Testing Library
|Workspace Layout:src/pages|src/components|src/api|src/store|src/router|src/utils|src/hooks|tests
|Package And Formatting:默认使用 pnpm。|遵循本地 eslint 与 prettier 配置，前端使用 2-space formatting。|source、env、test files 保持 UTF-8。
|Commands:install=cd infoq-scaffold-frontend-react && pnpm install|dev=cd infoq-scaffold-frontend-react && pnpm run dev|test=cd infoq-scaffold-frontend-react && pnpm run test|coverage=cd infoq-scaffold-frontend-react && pnpm run test:coverage|lint=cd infoq-scaffold-frontend-react && pnpm run lint:fix|build=cd infoq-scaffold-frontend-react && pnpm run build:prod
|OpenSpec Routing:凡是影响 React code 的新功能、行为变更或跨工作区交付，编码前先创建或定位 `openspec/changes/<change-id>/`。|实现与验证以 `proposal.md`、`tasks.md`、`design.md` 为准。
|Component Boundary:优先使用 Ant Design 和现有 React patterns，再考虑自定义组件。|组件 API 或版本支持检查使用 ant-design-component-reference。|本工作区不要套用 Vue 或 Element Plus 规则。
|Testing Boundary:React 单测与 coverage 工作使用 infoq-react-unit-test-patterns。|优先 Vitest + Testing Library 的行为断言、MemoryRouter helpers 与直接 Zustand store setup，不做实现细节测试。|扩展 shared router/store/utils 路径或用户明确要求 coverage 时运行 coverage。
|Verification:React 行为变更先验证 main flow，再根据影响范围跑 targeted 或 full unit tests，然后 lint，最后 production build。|渲染流程如 `/login`、route guards 受影响时使用 infoq-react-browser-automation 做 runtime UI smoke。|本地 React 栈需要启动或重启时使用 infoq-react-run-dev-stack。
|Boundaries:React 专属规则只留在本工作区；Vue command、Element Plus API、Vue Test Utils 模式归 `infoq-scaffold-frontend-vue`。
