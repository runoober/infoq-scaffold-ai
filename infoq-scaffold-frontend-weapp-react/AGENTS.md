# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|Scope:本文件适用于 `infoq-scaffold-frontend-weapp-react` 及其子目录，用于把根规则收窄到小程序 React 语境。
|Stack:Taro 4|React 18|TypeScript|Sass|Zustand|WeChat Mini Program|H5
|Workspace Layout:src/pages|src/components|src/mobile-core|src/store|src/utils|src/styles|config|types
|Package And Formatting:默认使用 pnpm。|遵循本地 eslint/stylelint 配置，前端使用 2-space formatting。|source、env、build config files 保持 UTF-8。
|Commands:install=cd infoq-scaffold-frontend-weapp-react && pnpm install|dev:h5=cd infoq-scaffold-frontend-weapp-react && pnpm run dev:h5|dev:weapp=cd infoq-scaffold-frontend-weapp-react && pnpm run dev:weapp|build:h5=cd infoq-scaffold-frontend-weapp-react && pnpm run build:h5|build:weapp=cd infoq-scaffold-frontend-weapp-react && pnpm run build:weapp|build-open:weapp=cd infoq-scaffold-frontend-weapp-react && pnpm run build-open:weapp|build-open:weapp:dev=cd infoq-scaffold-frontend-weapp-react && pnpm run build-open:weapp:dev
|OpenSpec Routing:凡是影响本工作区的新功能、行为变更或 workspace/tooling change，编码前先创建或定位 `openspec/changes/<change-id>/`。|实现与验证以 `proposal.md` 和 `tasks.md` 为准。
|Mini Program Boundary:WeChat Mini Program 与 H5 shared code 必须保持显式。|runtime/env incompatibilities 优先在 `src/mobile-core` 或 `config/` 内修正，不要加静默 fallback。|AppID 和 API origin 只能放在 `.env.*` 或 shell env，禁止硬编码进源码。
|Patch Policy:保持 `pnpm.patchedDependencies` 与 `patches/` 同步。|若某个 patch 是为了小程序 runtime 安全，必须说明原因；废弃 patch 要及时删除，不留死文件。
|Verification:行为或 tooling 变更先验证 main flow，再运行受影响的 build command（`build:weapp`、`build:weapp:dev`、`build:h5`），然后做适用的 lint checks，最后 diff review。|验证 WeChat DevTools open flow 时，通过 package scripts 调用根 `script/build-open-wechat-devtools.mjs`。
|Boundaries:小程序专属规则只留在本工作区；React admin 规则归 `infoq-scaffold-frontend-react`，Vue admin 规则归 `infoq-scaffold-frontend-vue`。
