# Skills 指南

## 1. 什么是 `.codex/skills`

`.codex/skills` 是本仓库的能力库。它的核心目标不是存放提示词，而是把可重复的研发动作沉淀成可执行 SOP，让 Codex 在真实仓库里稳定复用。

在这个项目里，skill 主要承担三件事：

- 为某类任务定义稳定工作流
- 把脚本、参考资料、模板和约束组织在一起
- 让 AI 在命中语义时自动选择正确路径，而不是临时猜

## 2. 一个 skill 通常包含什么

典型目录结构如下：

| 目录/文件 | 作用 |
| --- | --- |
| `SKILL.md` | skill 入口说明、触发条件、执行步骤 |
| `scripts/` | 可直接运行的自动化脚本 |
| `references/` | 规则、清单、索引、背景材料 |
| `templates/` | 固定模板、命令模板、产物模板 |
| `agents/` | 某些 skill 需要的额外 agent 配置 |

## 3. skill 是如何被触发的

本仓库里，skill 触发主要有三种来源：

1. 用户明确点名某个 skill
2. `AGENTS.md` 中的 `Skill Trigger` 命中语义
3. Codex 先读 `AGENTS.md`，再根据任务类型主动选择最匹配的 skill

这意味着 skill 的关键不只是脚本，还包括触发描述写得是否准确。

## 4. 当前仓库的关键 skills

| Skill | 作用 | 典型场景 |
| --- | --- | --- |
| `agent-browser` | 通用浏览器自动化 | 页面打开、点击、截图、抓取、控制台检查 |
| `infoq-browser-automation` | 项目专用浏览器验证 | 本地联调、路由校验、登录态注入 |
| `infoq-run-dev-stack` | 启动/停止前后端联调环境 | 后端、Vue、React 本地联调 |
| `infoq-backend-smoke-test` | 后端冒烟测试 | 登录、菜单、导出、受保护接口检查 |
| `infoq-login-success-check` | 登录链路验证 | `/auth/login`、token、受保护接口 |
| `infoq-codebase-index` | 仓库定位与索引刷新 | 查类、找文件、同步索引 |
| `infoq-subagent-delivery` | 仓库内多专家 subagent 交付 | PRD/DESIGN/TRS/MATERIAL/DELIVERY 闭环、backend + React + Vue 协同实现 |
| `infoq-plugin-introducer` | 插件接入与治理 | 新增插件、插件开关化 |
| `infoq-project-reference` | 项目静态参考信息 | 目录、入口、命令、命名规范 |
| `infoq-version-bump` | 版本号统一变更 | 同步 pom/package/docker/readme/doc 版本号 |
| `skill-creator` | 创建或演进新 skill | 新增 skill、优化触发语义、补充验证 |

## 5. 为什么 skill 是这个仓库的重要资产

因为它把“经验”变成了“稳定动作”。例如：

- 本地联调不再靠口头说明，而是交给 `infoq-run-dev-stack`
- 登录校验不再临时拼命令，而是交给 `infoq-login-success-check`
- 版本升级不再手动搜全仓，而是交给 `infoq-version-bump`

skill 的价值不只是“更快”，而是“更稳定、更少偏差、更易复用”。

## 6. 如何新增一个 skill

如果要给仓库新增能力，建议按下面的顺序做：

1. 明确这个 skill 的边界，先说清楚“解决什么问题”
2. 写 `SKILL.md`，把触发条件和默认行为说清楚
3. 能脚本化的部分放到 `scripts/`
4. 长说明、索引、清单放到 `references/`
5. 如果需要自动触发，把 skill 注册到 `AGENTS.md`
6. 补最小可验证脚本或回归校验，避免 skill 只停留在描述层

## 7. 什么时候不应该新增 skill

下面这些情况通常不值得单独沉淀 skill：

- 只会执行一次的临时任务
- 与当前项目几乎没有复用价值的个性化流程
- 只是补一段很短的提示，而没有明确输入、动作和产物

如果不能复用，直接做任务往往更合适。

## 8. 相关入口

- 顶层规则：`/AGENTS.md`
- AGENTS 指南：`./agents-guide.md`
- subagents 使用指南：`./subagents-guide.md`
- skill 创建器：`../.codex/skills/skill-creator/SKILL.md`
- 版本升级 skill：`../.codex/skills/infoq-version-bump/SKILL.md`
