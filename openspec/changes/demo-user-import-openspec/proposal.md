# Proposal: demo-user-import-openspec

## Why

本 change 提供一份完整的 OpenSpec demo change，作为本仓库用户导入能力的参考样板。

它的目标不是交付新的“用户导入增强”代码，而是展示：

- `proposal.md` 应该怎么写
- `design.md`、`tasks.md`、`materials.md` 应该如何协同
- spec delta 如何描述用户导入能力
- 未实际开发时，`review.md` 应如何明确阻塞并避免假归档

## What Changes

让维护者能够直接参考一份 OpenSpec change 完成后续真实需求的起草、实现和验收。

### Scope

- 基于现有 backend、React、Vue 的用户导入能力整理一份 OpenSpec 示例
- 明确三端的用户导入入口、行为约束和验证路径
- 为后续真实“用户导入增强”提供 proposal/design/tasks/spec delta 样板

### Non-Goals

- 不修改数据库结构
- 不新增业务系统中的 agent 编排页面或 API
- 不在本轮提交真实用户导入功能代码
- 不把本示例伪装成已完成归档的真实 change

### Main Flow

1. 管理员进入用户管理页面并打开“用户导入”对话框
2. 下载模板、填写模板、上传文件，并选择是否覆盖已存在用户数据
3. 系统校验文件并返回导入结果，管理员确认成功/失败明细

## Acceptance Contract

- Functional scope: 产出一套完整的 OpenSpec demo artifacts，覆盖 `proposal.md`、`design.md`、`tasks.md`、`materials.md`、`review.md` 和用户导入 spec delta，并明确三端评估结果。
- Non-goals: 不执行真实功能开发，不执行真实验证，不归档该 change。
- Exception handling and blockers: 若示例引用的代码入口与仓库现状不一致，必须在 `tasks.md` 或 `review.md` 中标出差异和阻塞。
- Required verification evidence: 至少记录计划中的验证命令，并显式声明“本示例未执行真实实现与验证”。
- Rollback trigger or rollback conditions: 若该示例被误读为真实交付结果，应立即补充或改写警示说明，避免误导后续实施。

## Risks And Open Questions

- 风险：如果示例写得像真实交付，后续团队可能误以为用户导入增强已经实现
- 风险：如果示例过于抽象，后续维护者仍可能无法快速复用这份 change 结构
- 待确认：后续真实“用户导入增强”是否需要统一成功/失败明细展示格式
- 待确认：后续真实实现是否要补 React / Vue 的更细粒度回归测试
