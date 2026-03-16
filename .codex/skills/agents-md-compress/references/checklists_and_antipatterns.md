# Checklists & Anti-Patterns

## Format Checklist

- 第一行是否为 `# AGENTS.md`。
- 是否包含 `|IMPORTANT:`。
- 标题后非空行是否全部 `|` 开头。
- 是否移除了 `##`/`###` 与代码围栏。

## Content Checklist

- 是否覆盖项目根、模块/工作区、配置文件、构建/测试命令。
- 路径是否真实存在且拼写准确。
- 是否包含提交规范与 PR 检查项。

## Conciseness Checklist

- 是否把解释性文字压缩为索引事实。
- 是否避免一行承载多个不相关主题。
- 行数是否在可维护范围（建议 15-35 行）。

## Anti-Patterns

- 使用传统章节散文替代索引行。
- 保留大段解释、长代码块、重复说明。
- 写入不存在的路径或“猜测式”命令。
- 缺少 `|IMPORTANT:` 导致优先策略不明确。
