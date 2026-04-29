# Skills 指南

## 1. 什么是 `.agents/skills`

`.agents/skills` 是本仓库的能力库。它不是“提示词仓库”，而是把稳定、可复用的研发动作沉淀成可执行 SOP，让 Codex 在真实仓库里可重复地完成同一类工作。

在这个项目里，skill 主要承担三件事：

- 定义某类任务的默认工作流
- 把脚本、reference、assets 和约束组织在一起
- 让 `AGENTS.md` 可以用精确的 skill 名称做强制路由

## 2. 当前 skill 设计原则

当前仓库的 skill 结构有四条硬约束：

1. 每个 skill 只解决一个工作
2. 除 `skill-creator` 外，仓库级 skill 全部使用 `infoq-` 前缀
3. `.agents/skills` 下不保留共享底座型、仅 README 型、或 helper-only skill 目录
4. React 家族和 Vue 家族 skill 允许通过 `references/admin` 与 `references/weapp` 区分客户端，但仍然必须保持单一职责

这意味着：

- React 家族运行态验证统一进 `infoq-react-runtime-verification`
- React 家族单测统一进 `infoq-react-unit-test-patterns`
- Vue 家族运行态验证统一进 `infoq-vue-runtime-verification`
- Vue 家族单测统一进 `infoq-vue-unit-test-patterns`

而不是拆成 admin skill、weapp skill、run-dev-stack skill、shared-base skill 四五层。

## 3. 一个 skill 通常包含什么

典型目录结构如下：

| 目录/文件 | 作用 |
| --- | --- |
| `SKILL.md` | skill 入口说明、触发条件、默认步骤 |
| `agents/openai.yaml` | UI 元数据，供 skill 列表与快捷调用使用 |
| `scripts/` | 可直接运行的自动化脚本 |
| `references/` | 规则、清单、上下文材料 |
| `assets/` | 模板、图标、样板文件等输出资源 |
| `agents/` | skill 的额外 agent 配置目录 |

如果一个目录没有 `SKILL.md`，它就不应该出现在仓库级 skill 列表里。
除 `SKILL.md`、`agents/`、`scripts/`、`references/`、`assets/` 外，不应再新增顶层辅助文件。

## 4. skill 是如何被触发的

本仓库里，skill 触发主要有三种来源：

1. 用户明确点名某个 skill
2. `AGENTS.md` 里的 `Skill Trigger` 命中语义
3. Codex 先读 `AGENTS.md`，再根据任务类型主动选择最匹配的 skill

因此 skill 的关键不只是脚本，还有：

- `SKILL.md` 的 `description` 是否写清触发场景
- `AGENTS.md` 是否把它路由到了正确工作区
- `README`、`doc/*.md` 是否与 skill 实际路径保持一致

如果某个 skill 明确依赖仓库级 MCP，还要再检查一层：

- skill 文档里引用的 MCP server 名称、工具能力、默认启用状态、审批要求，必须和 `.codex/config.toml`、`doc/mcp-servers.md` 保持一致
- 如果只是 skill 需要某个 MCP，但 `.codex/config.toml` 并没有启用或暴露对应工具，应该先修真值配置和 MCP 文档，而不是只在 `SKILL.md` 里单独写一套

## 5. 当前仓库的关键 skills

| Skill | 职责 | 典型场景 |
| --- | --- | --- |
| `infoq-browser-automation` | 通用浏览器自动化 | 页面打开、点击、截图、抓取、控制台检查 |
| `infoq-react-runtime-verification` | React 家族运行态验证 | React admin 登录、路由校验、截图、React weapp DevTools 打开与 smoke |
| `infoq-vue-runtime-verification` | Vue 家族运行态验证 | Vue admin 登录、路由校验、截图、Vue weapp DevTools 打开与 smoke |
| `infoq-react-unit-test-patterns` | React 家族单测 | React admin / weapp React 单测、coverage、回归补测 |
| `infoq-vue-unit-test-patterns` | Vue 家族单测 | Vue admin / weapp Vue 单测、coverage、回归补测 |
| `infoq-backend-smoke-test` | 后端冒烟测试 | 单节点 HTTP smoke、双节点 WebSocket 集群 smoke、登录、菜单、导出、受保护接口检查 |
| `infoq-login-success-check` | 登录链路验证 | `/auth/login`、token、受保护接口 |
| `infoq-codebase-index` | 仓库定位与索引刷新 | 查类、找文件、同步索引 |
| `infoq-openspec-delivery` | OpenSpec 交付编排 | 默认主线程编排；用户显式要求 subagents 时转到 `.codex/agents/` 中的 4 角色闭环 |
| `infoq-plugin-introducer` | 插件接入与治理 | 新增插件、插件开关化 |
| `infoq-project-reference` | 项目静态参考 | 目录、入口、命令、命名规范 |
| `infoq-version-bump` | 版本号统一变更 | 同步 backend/frontend/docs package、docker、README、根 doc 与 docs 站点镜像版本号 |
| `infoq-ant-design-component-reference` | Ant Design 组件参考 | React 页面组件选择与 API 校验 |
| `infoq-element-plus-component-reference` | Element Plus 组件参考 | Vue 页面组件选择与 API 校验 |
| `infoq-agents-md-compress` | AGENTS 压缩与维护 | 创建、压缩、更新 `AGENTS.md` |
| `infoq-ui-ux-three-phase-protocol` | 大型 UI 审批流 | ASCII 线框、静态 demo、正式实现与运行态比对 |
| `skill-creator` | skill 创建与演进 | 新增 skill、改 skill、评估触发语义 |

## 6. 为什么当前不再保留共享底座 skill

旧结构里最容易出问题的是“公共底座 skill + 多个 wrapper skill”。问题有三个：

- 用户和 `AGENTS.md` 很难分辨真正该触发哪个 skill
- 文档和脚本容易断链，wrapper 改名后底座路径常被漏改
- skill 的职责边界被稀释，最后变成“文档存在、脚本不可用”

因此当前仓库的策略是：

- 通用浏览器工作保留为独立 skill：`infoq-browser-automation`
- React 家族和 Vue 家族在各自 skill 内部通过 `references/admin`、`references/weapp` 区分客户端
- 不再额外拆一个 repo 内共享底座 skill

## 7. 如何新增一个 skill

建议按下面顺序做：

1. 先说清这个 skill 只负责什么工作
2. 写 `SKILL.md`，把触发条件和默认流程写清楚
3. 能脚本化的部分放到 `scripts/`
4. 长说明、矩阵、清单放到 `references/`
5. 把 skill 路由接到相关 `AGENTS.md`
6. 如果 skill 使用仓库级 MCP，先核对 `.codex/config.toml` 和 `doc/mcp-servers.md` 是否已经准确覆盖
7. 同步 `README.md` 和相关 `doc/*.md`

如果新增 skill 会导致“再多一个共享底座目录”，先停下来重做设计。

## 8. 什么时候不应该新增 skill

下面这些情况通常不值得单独沉淀 skill：

- 只会执行一次的临时任务
- 与当前项目几乎没有复用价值的个性化流程
- 只是补一段提示，而没有明确输入、动作和产物
- 本质上只是另一个 skill 的 `references/<variant>`，没有形成新的单一职责

## 9. 相关入口

- 顶层规则：`/AGENTS.md`
- repo 级 custom agents：`/.codex/agents/`
- AGENTS 指南：`./agents-guide.md`
- subagents 使用指南：`./subagents-guide.md`
- skill 创建器：`../.agents/skills/skill-creator/SKILL.md`
- 项目静态参考：`../.agents/skills/infoq-project-reference/references/project-reference.md`
