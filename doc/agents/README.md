# doc/agents

`doc/agents` 只存放 Codex subagent 工作流的参考模板，不存放具体任务产物。

规则：

- 这里的 `*.template.md` 只作为写作骨架与校验口径
- 任何实际需求的 `PRD.md`、`DESIGN.md`、`TRS.md`、`MATERIAL.md`、`DELIVERY.md` 都必须写到 `doc/plan/<task-slug>/`
- 推荐先执行：
  - `bash .codex/skills/infoq-subagent-delivery/scripts/init_plan_dir.sh <task-slug>`

模板列表：

- `PRD.template.md`
- `DESIGN.template.md`
- `TRS.template.md`
- `MATERIAL.template.md`
- `DELIVERY.template.md`
