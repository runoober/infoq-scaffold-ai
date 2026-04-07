# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|Scope:本文件适用于仓库根目录及未被更近 `AGENTS.md` 或 `AGENTS.override.md` 覆盖的路径。
|Encoding:所有项目文件必须使用 UTF-8 编码。
|Package Manager:前端默认使用 pnpm 执行 install/dev/lint/test/build；仅在 pnpm 不可用时退回 npm。
|Failure Policy:产品代码优先显式失败，不接受静默 fallback、吞错或假成功；确需 fallback 时必须显式、可说明、易关闭，并经过用户批准。
|Engineering Baseline:保持抽象务实；遵守 DRY/YAGNI/关注点分离；命名清晰、注释只写关键意图；优先直接修复，不保留无必要兼容层；兼容性不是明确要求时，删除死代码和过时分支。
|Security And Validation:源码中禁止硬编码密钥；边界处校验外部输入；数据库访问使用参数化查询；保持代码可测试；优先自动化校验；后端单测总时长控制在 60 秒内。
|AI Coding Guardrails:避免无意义过度注释，注释解释意图而不是逐行复述。|避免只为“更干净”而改变行为的空重构。|避免范围蔓延，只实现用户明确要求。|处理错误与边界情况，不假设输入永远理想。|优先最小改动，不做大面积重写。|若某段改动被识别为错误，先立即回退错误代码，再继续处理，不留下死代码。|不要为了让测试或构建通过而削弱断言、放宽 mock、压警告、抬阈值或伪造成功路径。
|Acceptance Contract:实现前必须在当前任务上下文中写清一个 acceptance contract，覆盖 functional scope、non-goals、exception handling、required logs or observability、rollback trigger or conditions；若缺项或冲突，先暴露问题再编码。
|Execution Loop:按最小闭环工作，一次只改一类问题。|验证顺序固定为 main-flow verification -> targeted tests -> lint/build or equivalent checks -> diff review。|每次代码改动交付前都必须通过相关单元测试；若不适用或跑不起来，必须明确写出 blocker，不能当作 ready。|除非用户明确要求，不要把无关重构和行为修改绑在一起。
|Release Guardrails:可发布变更必须保持依赖版本与 lockfile 一致。|执行或部署前核验必需 env、config 和外部依赖。|影响共享环境、数据或部署状态的高风险/破坏性操作必须先获明确确认。
|Pre-Release Checklist:发布或交付前显式检查 performance impact、alerting/observability coverage、rollback path/script、config/SQL/dependency impact；任何未检查项都要作为 residual risk 说明。
|Instruction Layering:根 `AGENTS.md` 只保留跨仓规则。|backend、Vue、React admin、weapp React 使用更近的 `AGENTS.md` 或 `AGENTS.override.md` 写栈内细则。|当更近文件与根规则冲突时，以更近文件为准。
|Workspace AGENTS:infoq-scaffold-backend/AGENTS.md|infoq-scaffold-frontend-vue/AGENTS.md|infoq-scaffold-frontend-react/AGENTS.md|infoq-scaffold-frontend-weapp-react/AGENTS.md
|Repo Skill Policy:每个 skill 只解决一个工作。|详细触发范围写在各自 `SKILL.md` 的 description。|根 `AGENTS.md` 只保留 skill 优先级与强制路由，不重复整本 skill 手册。
|Repo Skill Location:仓库级 skills 统一放在 `.agents/skills`。|相关 references、helper scripts 和发现逻辑保持与该路径一致。
|OpenAI Docs MCP:涉及 OpenAI API、Responses API、ChatGPT Apps SDK、Codex、MCP、AGENTS.md、skills 或 subagent 问题时，优先使用 `openai-docs` MCP；优先官方文档，不依赖记忆或第三方总结。
|Spec Workflow:凡是新功能、行为变更或跨工作区交付，编码前先创建或定位 `openspec/changes/<change-id>/`。|长期项目上下文放在 `openspec/project.md`。|当前真值放在 `openspec/specs/`。|进行中的工作放在 `openspec/changes/<change-id>/`。
|Local Skills:.agents/skills:{agent-browser,agents-md-compress,ant-design-component-reference,element-plus-component-reference,infoq-backend-smoke-test,infoq-backend-unit-test-patterns,infoq-codebase-index,infoq-vue-browser-automation,infoq-react-browser-automation,infoq-vue-run-dev-stack,infoq-react-run-dev-stack,infoq-vue-unit-test-patterns,infoq-login-success-check,infoq-plugin-introducer,infoq-project-reference,infoq-react-unit-test-patterns,infoq-openspec-delivery,infoq-version-bump,skill-creator}
|Skill Priority:通用网站或浏览器工作优先用 agent-browser。|仅 Vue 仓库运行态验证使用 infoq-vue-browser-automation。|仅 React 仓库运行态验证使用 infoq-react-browser-automation。|需要稳定仓库参考信息时，在确认更近 AGENTS 未覆盖后使用 infoq-project-reference。|定位 backend、React、Vue 的文件或类，或发生 add/delete/rename/move/class-name change 后使用 infoq-codebase-index。
|Skill Trigger:创建、压缩或更新 `AGENTS.md` 使用 agents-md-compress。|后端单测、mapper XML 集成测试、回归补测或 test-first backend fix 使用 infoq-backend-unit-test-patterns。|backend smoke/API/runtime verification 使用 infoq-backend-smoke-test。|登录、鉴权、登录失败诊断使用 infoq-login-success-check。|Vue 单测与 coverage 仅在 `infoq-scaffold-frontend-vue` 使用 infoq-vue-unit-test-patterns。|React 单测与 coverage 仅在 `infoq-scaffold-frontend-react` 使用 infoq-react-unit-test-patterns。|启动、重启、停止本地 Vue 栈使用 infoq-vue-run-dev-stack。|启动、重启、停止本地 React 栈使用 infoq-react-run-dev-stack。|Vue 本地登录、路由、截图、console verification 使用 infoq-vue-browser-automation。|React 本地登录、路由、截图、console verification 使用 infoq-react-browser-automation。|React Ant Design 组件/API 选择使用 ant-design-component-reference。|Vue Element Plus 组件/API 选择使用 element-plus-component-reference。|插件引入与治理使用 infoq-plugin-introducer。|默认的新功能交付、行为变更、OpenSpec 工作流、多专家跨 backend/React/Vue 交付使用 infoq-openspec-delivery。|仓库级版本升级使用 infoq-version-bump。
|Subagent Docs:openspec:{project.md,specs/README.md,changes/README.md}|doc:{agents-guide.md,skills-guide.md,subagents-guide.md}
|Subagent Flow:OpenSpec 交付使用 `requirements_expert -> product_designer(optional) -> technical_designer -> material_curator(optional) -> code_implementer -> auto_fixer -> delivery_auditor`。|`technical_designer` 可在 `proposal.md` 后启动；若 UX 决策重要，则在 `design.md` 后启动。|验证证据不要堆在主对话，显式总结 blocker。
|Subagent Output:`requirements_expert` 负责 `proposal.md` 和 spec deltas。|`product_designer` 在需要时产出 `design.md`。|`technical_designer` 产出 `tasks.md`。|`material_curator` 仅在 copy/mock/icon 指南确有价值时产出 `materials.md`。|`delivery_auditor` 只有在 verification evidence 存在后才归档。
|Code Index Refresh:当 `infoq-scaffold-backend`、`infoq-scaffold-frontend-react` 或 `infoq-scaffold-frontend-vue` 发生 add/delete/rename/move/class-name change 后，运行 `python3 .agents/skills/infoq-codebase-index/scripts/sync_indexes.py`，保持 skill 引用和 AGENTS 路由同步。
