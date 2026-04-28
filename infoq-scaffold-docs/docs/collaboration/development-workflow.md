---
title: "研发协作与工作流"
description: "从 acceptance contract 到验证闭环的日常流程。"
outline: [2, 3]
---

> [!TIP]
> 内容真值源：[`doc/development-workflow.md`](https://github.com/luckykuang/infoq-scaffold-ai/blob/main/doc/development-workflow.md)
> 本页由 `infoq-scaffold-docs/scripts/sync-from-root-doc.mjs` 自动同步生成；请优先修改根 `doc/` 后再重新同步。

# 研发协作与工作流

这个仓库最大的特点不是“技术栈很多”，而是把 AI 协作、规格管理、验证闭环和交付文档都放进了同一条工程流水线。理解这套工作流，比记住几个命令更重要。

## 1. 先知道哪些文件是规则真值

| 主题 | 真值文件 |
| --- | --- |
| 根级协作规则 | `AGENTS.md` |
| 工作区规则 | 各工作区自己的 `AGENTS.md` |
| 项目级技能 | `.agents/skills/*/SKILL.md` |
| 规格与变更 | `openspec/project.md`、`openspec/specs/`、`openspec/changes/` |
| MCP 配置 | `.codex/config.toml` |
| 用户手册 | `doc/*.md` |

## 2. `AGENTS.md` 分层怎么理解

规则读取顺序是“就近优先”：

1. 先看根 `AGENTS.md`
2. 再看当前工作区的 `AGENTS.md`
3. 更近文件和根规则冲突时，以更近文件为准

所以：

- 用户手册不要写进 `AGENTS.md`
- 机器协作规则也不要散落在 `README.md`

`AGENTS.md` 负责约束“如何工作”，`doc/` 负责说明“项目是什么、如何用、如何部署”。

## 3. OpenSpec 在本仓库里的角色

根规则已经把 OpenSpec 分成三级：

| 级别 | 适用场景 | 要求 |
| --- | --- | --- |
| L3 强制 | 新功能、API 契约变更、跨工作区交付 | 建立 `openspec/changes/<change-id>/` 全套产物 |
| L2 建议 Lite | 单工作区行为变更，不改 API 契约 | 至少 `proposal.md` + `tasks.md` |
| L1 可豁免 | 小修复、不改契约、范围小 | 可不建 OpenSpec，但必须先写 acceptance contract |

如果你不确定属于哪级，默认按高一级处理。

## 4. 日常改动的推荐顺序

### 4.1 改动前

1. 读相关工作区和最近的 `AGENTS.md`
2. 读相关代码和配置，而不是靠记忆假设
3. 在任务上下文里先写 acceptance contract

### 4.2 改动中

1. 一次只改一类问题
2. 优先最小闭环，不绑无关重构
3. 如果改动影响配置、命令、部署入口、env 或文档行为，同步更新 `doc/` 和 `README.md`

### 4.3 改动后

验证顺序固定为：

1. 主流程验证
2. 定向测试
3. lint / build 或等价静态检查
4. diff review

## 5. skills 和 MCP 是怎么配合的

### skills

`skills` 负责把高频任务沉淀成仓库内 SOP，例如：

- 浏览器自动化
- 后端 smoke
- React / Vue 运行态验证
- React / Vue 单元测试模式
- OpenSpec 交付
- 版本升级

入口文档：

- [`skills-guide.md`](/collaboration/skills-guide)

### MCP

`.codex/config.toml` 当前重点启用：

- `playwright`
- `openai-docs`
- `chrome-devtools`

入口文档：

- [`mcp-servers.md`](/collaboration/mcp-servers)

典型搭配：

- 页面联调：skill + `playwright`
- 前端深度排查：`chrome-devtools`
- OpenAI / Codex / AGENTS / MCP 相关问题：`openai-docs`

## 6. 各工作区最小验证命令

| 工作区 | 最小验证 |
| --- | --- |
| Backend | 主流程验证 + 定向 Maven 测试 |
| Vue Admin | `pnpm run test:unit` + `pnpm run build:prod` |
| React Admin | `pnpm run test` + `pnpm run build:prod` |
| Vue Weapp | `pnpm run typecheck` + `pnpm run test` + `pnpm run build:weapp:dev` |
| React Weapp | `pnpm run test` + `pnpm run lint` + `pnpm run build:weapp:dev` |

## 7. 什么时候必须更新文档

出现以下变化时，不应该只改代码：

- 启动命令变了
- 环境变量变了
- 部署入口变了
- MCP server / tool / 审批模式变了
- 目录入口变了
- skill 名称或行为变了

根规则已经明确要求这些变化同步更新 `AGENTS.md`、`README.md` 和相关 `doc/*.md`，否则文档和真实行为会漂移。

## 8. 什么时候要刷新索引或额外维护

### 代码索引

如果 `infoq-scaffold-backend`、`infoq-scaffold-frontend-react`、`infoq-scaffold-frontend-vue` 发生文件或类名层面的增删改移动，需要执行：

```bash
python3 .agents/skills/infoq-codebase-index/scripts/sync_indexes.py
```

### 根 AGENTS 压缩

如果任务是创建、压缩或更新根 `AGENTS.md`，优先走 `infoq-agents-md-compress`。

## 9. 这套工作流的核心原则

- retrieval-first：先读仓库文件，再做判断
- explicit failure：宁可显式失败，不要静默 fallback
- smallest useful change：优先最小闭环
- evidence-based verification：验证结果优先于主观“应该没问题”
- docs as delivery asset：文档不是附属品，而是交付物的一部分

## 10. 继续往下读

- 项目总览：[`project-overview.md`](/guide/project-overview)
- 后端手册：[`backend-handbook.md`](/backend/handbook)
- 管理端手册：[`admin-handbook.md`](/admin/handbook)
- 小程序手册：[`weapp-handbook.md`](/weapp/handbook)
