# doc/plan

`doc/plan` 存放所有按 subagent 工作流产出的真实任务文档。

目录规则：

- 一次需求对应一个子目录：`doc/plan/<task-slug>/`
- 推荐 slug：`YYYY-MM-DD-short-topic`
- 任务目录中至少包含：
  - `PRD.md`
  - `DESIGN.md`
  - `TRS.md`
  - `MATERIAL.md`
  - `DELIVERY.md`

注意：

- `doc/agents/` 只放模板，不放真实任务内容
- 即使某个阶段暂未实现，也要在对应文档中显式写清楚阻塞、延期或非目标
- 若用户明确把后续能力延期，例如“业务系统里可视化触发 agent 的页面/API”，必须写入计划文档，而不是直接丢弃
