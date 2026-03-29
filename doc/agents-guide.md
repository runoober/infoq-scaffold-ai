# AGENTS 指南

## 1. AGENTS.md 是什么

`AGENTS.md` 是这个仓库面向 AI 协作的第一层执行协议。它不只是补充文档，而是告诉 Codex:

- 进入仓库后先读什么
- 哪些规则优先级最高
- 哪类任务该触发哪个 skill
- 哪些目录才是这次任务真正应该工作的地方

在 `infoq-scaffold-ai` 中，`AGENTS.md` 的目标不是“写很多解释”，而是用尽量短的索引行，把高优先级规则稳定放进上下文。

## 2. 它解决什么问题

如果没有 `AGENTS.md`，AI 虽然能读代码，但很难稳定知道：

- 哪些工作区分别对应后端、Vue 前端、React 前端、脚本和 SQL
- 用户说“启动项目”“冒烟测试”“找类名”“新增插件”时，应该先走哪条 SOP
- 哪些是必须遵守的工程规则，哪些只是参考信息
- 哪些信息应保留在顶层规则，哪些应下沉到 skills 或 references

`AGENTS.md` 的作用，就是把这些关键信息变成显式、可检索、可执行的入口。

## 3. 当前 AGENTS 的核心内容

本仓库当前的 `AGENTS.md` 主要承载六类信息：

| 类别 | 作用 |
| --- | --- |
| 全局工程规则 | 检索优先、UTF-8、错误处理、最小改动、发布前检查 |
| 接受标准 | 在任务开始前定义 acceptance contract，结束前说明残余风险 |
| 执行顺序 | main-flow verification -> targeted tests -> lint/build -> diff review |
| OpenSpec 主流程 | 定义 `openspec/project.md`、`openspec/specs/`、`openspec/changes/` 的职责 |
| skill 路由 | 定义本地 skills 列表、触发语义和 skill 目录索引 |
| 刷新约束 | 例如代码索引何时必须同步 |

## 4. 为什么它采用压缩索引格式

当前仓库使用的是压缩后的 AGENTS 结构，而不是长篇叙述文档，原因很直接：

- 顶层规则需要稳定命中，不能被长文本稀释
- AI 每轮都会读取顶层规则，越短越利于保持一致性
- 静态但非高优先级的信息应沉淀到 `doc/` 或 skill `references/`

因此，`AGENTS.md` 只保留必须常驻上下文的内容，解释性材料放到文档目录或 skill 内部。

## 5. AGENTS 与 skill 的关系

可以把两者理解成两层系统：

1. `AGENTS.md` 决定“该遵守什么规则”和“该触发什么能力”
2. `.agents/skills` 决定“这类任务具体怎么做”

也就是说：

- `AGENTS.md` 负责路由
- skill 负责 SOP
- 仓库代码负责最终交付

## 6. 什么时候应该更新 AGENTS.md

适合更新 `AGENTS.md` 的情况：

- 新增了一个应该自动触发的本地 skill
- 项目级规则、校验顺序、发布边界发生变化
- 某项高优先级约束需要进入每轮上下文

不适合继续堆进 `AGENTS.md` 的情况：

- 详细的启动命令说明
- 冗长的背景解释
- 某类任务的长流程 SOP
- 低频使用的静态参考材料

这些内容更适合写进 `doc/` 或 skill 的 `references/`

## 7. 相关入口

- 顶层规则文件：`/AGENTS.md`
- skill 指南：`./skills-guide.md`
- subagents 使用指南：`./subagents-guide.md`
- 项目静态参考：`../.agents/skills/infoq-project-reference/references/project-reference.md`
- 压缩维护 skill：`../.agents/skills/agents-md-compress/SKILL.md`
