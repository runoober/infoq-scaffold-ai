# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|Scope:本文件适用于 `infoq-scaffold-frontend-weapp-react` 及其子目录，用于把根规则收窄到小程序 React 语境。
|Stack:Taro 4|React 18|TypeScript|Sass|Zustand|WeChat Mini Program|H5
|Workspace Layout:src/pages|src/components|src/api|src/store|src/utils|src/styles|config|types
|Package And Formatting:默认使用 pnpm。|遵循本地 eslint/stylelint 配置，前端使用 2-space formatting。|source、env、build config files 保持 UTF-8。
|Commands:install=cd infoq-scaffold-frontend-weapp-react && pnpm install|dev:h5=cd infoq-scaffold-frontend-weapp-react && pnpm run dev:h5|dev:weapp=cd infoq-scaffold-frontend-weapp-react && pnpm run dev:weapp|build:h5=cd infoq-scaffold-frontend-weapp-react && pnpm run build:h5|build:weapp=cd infoq-scaffold-frontend-weapp-react && pnpm run build:weapp|build-open:weapp=cd infoq-scaffold-frontend-weapp-react && pnpm run build-open:weapp|build-open:weapp:dev=cd infoq-scaffold-frontend-weapp-react && pnpm run build-open:weapp:dev|test:e2e:weapp:core=cd infoq-scaffold-frontend-weapp-react && pnpm run test:e2e:weapp:core|test:e2e:weapp:core:backend=cd infoq-scaffold-frontend-weapp-react && pnpm run test:e2e:weapp:core:backend
|Local Skills:.agents/skills:{infoq-weapp-react-unit-test-patterns,infoq-weapp-react-smoke-test}
|Skill Trigger:小程序 React 单测、coverage 补全、Vitest 回归补测使用 infoq-weapp-react-unit-test-patterns。|小程序 React 冒烟、weapp e2e、接口覆盖验证使用 infoq-weapp-react-smoke-test。
|OpenSpec Routing:分级执行。|L3(强制):本工作区新功能、API 契约变更、跨工作区交付，编码前先创建或定位 `openspec/changes/<change-id>/`。|L2(Lite):单工作区行为变更且不改 API 契约，至少维护 `proposal.md`+`tasks.md`。|L1(可豁免):单工作区小修复且不改契约、改动范围小可不建 OpenSpec，但必须先写 acceptance contract。|不确定分级时默认 L3。|OpenSpec 文档正文默认中文，路径名称/命令/文件名保持英文原样。|实现与验证以 full artifacts 或 Lite artifacts 为准。
|Mini Program Boundary:WeChat Mini Program 与 H5 shared code 必须保持显式。|runtime/env incompatibilities 优先在 `src/api`、`src/utils` 或 `config/` 内修正，不要加静默 fallback。|AppID 和 API origin 只能放在 `.env.*` 或 shell env，禁止硬编码进源码。
|Error Message Contract:请求异常文案禁止出现 `[object Object]`。|`src/api/request.ts` 必须先提取 `errMsg/message/msg`，无法提取时回退到可读中文默认文案。|涉及 request/error 逻辑变更必须补充 object rejection 与 `url not in domain list` 场景单测。
|E2E Determinism:`test:e2e:weapp:core` 默认无后端稳定模式（`WEAPP_E2E_AUTO_LOGIN=false` 且不注入 mock token）。|真实登录联调仅使用 `test:e2e:weapp:core:backend`，并要求后端可用且 `--captcha.enable=false`。|weapp smoke runner 日志若出现 `[object Object]` 必须判定为失败并先修复错误归一化。
|Patch Policy:保持 `pnpm.patchedDependencies` 与 `patches/` 同步。|若某个 patch 是为了小程序 runtime 安全，必须说明原因；废弃 patch 要及时删除，不留死文件。
|Verification:行为或 tooling 变更先验证 main flow，再运行受影响的 build command（`build:weapp`、`build:weapp:dev`、`build:h5`），然后做适用的 lint checks，最后 diff review。|验证 WeChat DevTools open flow 时，通过 package scripts 调用根 `script/build-open-wechat-devtools.mjs`。
|Boundaries:小程序专属规则只留在本工作区；React admin 规则归 `infoq-scaffold-frontend-react`，Vue admin 规则归 `infoq-scaffold-frontend-vue`。
