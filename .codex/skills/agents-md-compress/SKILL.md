---
name: agents-md-compress
description: 将 AGENTS.md 压缩为 Vercel 风格管道索引格式（每行以“|”开头，格式如“|Category:path:{files}”），并固化可复用规约。Use when users ask to create/update/compress AGENTS.md, convert narrative contributor guides into compact index format, or enforce AGENTS trigger/format rules.
---

# Agents Md Compress

## Core Objective

将冗长 AGENTS 文档转换为高密度、可检索、可执行的索引文档，让 agent 在每轮对话中稳定读取关键规则。

## Core Thinking

- 优先“检索导向推理”而不是“仅依赖预训练记忆”。
- 用“被动上下文”降低决策成本：关键规则直接放在 AGENTS 顶部，不依赖额外检索动作。
- 以“结构化索引行”替代解释性段落，提升命中率与一致性。

必须保留关键指令行：

- `|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks.`

## Hard Format Constraints

- 第一行必须是 `# AGENTS.md`。
- 除标题外，所有非空行必须以 `|` 开头。
- 优先使用以下两种表达：
  - 文件索引：`|Category:path:{file1,file2,file3}`
  - 命令/规则：`|Category:value1|value2|value3`
- 删除长段落、代码块、深层标题（`##`/`###`）。
- 目标产物通常控制在 15-35 行；超长时拆分到 `references/`。

## Execution Workflow

1. 读取当前 `AGENTS.md`，抽取最高优先级事实（结构、命令、约束、校验方式）。
2. 校验关键路径是否真实存在，避免写入无效索引。
3. 按索引格式压缩重写，仅保留可执行信息。
4. 需要自动触发时，补充以下行：
   - `|Local Skills:.codex/skills:{agents-md-compress}`
   - `|Skill Trigger:Use agents-md-compress when request mentions AGENTS.md creation, compression, or rule updates.`
5. 运行校验脚本并修正失败项。

## Quality Gate

运行：

- `python3 .codex/skills/agents-md-compress/scripts/example.py AGENTS.md`

通过标准：

- 标题行正确。
- 存在 `|IMPORTANT:` 行。
- 标题后非空行全部以 `|` 开头。
- 不含 `##`/`###`/代码围栏。

## Reference Loading Guide

按需加载，不要一次性全读：

- 压缩模板与示例：`references/api_reference.md`
- 原则、符号、格式边界：`references/compression_principles.md`
- 检查清单与反例：`references/checklists_and_antipatterns.md`
- 定期维护策略：`references/maintenance.md`
