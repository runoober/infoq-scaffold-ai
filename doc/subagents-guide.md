# Subagents 使用指南

## 1. 文档目标

本文档说明如何在 `infoq-scaffold-ai` 仓库内使用 Codex subagents 完成一次完整的需求交付闭环。

适用范围：

- 在仓库内通过 Codex 协作完成需求分析、设计、技术方案、素材准备、代码实现、自动修复与最终验收
- 覆盖 `infoq-scaffold-backend`、`infoq-scaffold-frontend-react`、`infoq-scaffold-frontend-vue`

不在本文档范围：

- 业务系统里可视化触发 agent 的页面/API
- 任务持久化、运行历史中心、在线重试控制台

这些内容已写入后续规划，见 `doc/plan/subagent-roadmap.md`。

## 2. 什么是 Subagents

根据 OpenAI 官方 Codex 文档，Codex 可以在你明确要求时生成多个子 agent，并在它们完成后汇总结果。这个能力适合多阶段、可拆分、跨角色的复杂任务。

在本仓库里，subagents 的用途不是“同时让很多 agent 随便发挥”，而是把一次需求交付拆成固定专家链路：

1. 需求收集
2. 产品设计
3. 技术设计
4. 素材准备
5. 代码实现
6. 自动修复
7. 最终交付验收

## 3. 本仓库的目录约定

### 3.1 配置与 agent 定义

- 全局 subagent 配置：`.codex/config.toml`
- 项目级 custom agents：`.codex/agents/*.toml`
- 统一入口 skill：`.codex/skills/infoq-subagent-delivery/`

### 3.2 文档目录

- 模板目录：`doc/agents/`
- 真实任务产物目录：`doc/plan/<task-slug>/`

强约束：

- `doc/agents/` 只放模板，不放真实任务内容
- 每次真实任务都必须创建 `doc/plan/<task-slug>/`
- `PRD.md`、`DESIGN.md`、`TRS.md`、`MATERIAL.md`、`DELIVERY.md` 都必须写到 `doc/plan/<task-slug>/`

## 4. 当前可用的专家

仓库当前已定义以下 custom agents：

| Agent | 责任 |
| --- | --- |
| `requirements_expert` | 分析需求，输出 `PRD.md` |
| `product_designer` | 基于 PRD 输出 `DESIGN.md` |
| `technical_designer` | 输出 `TRS.md`，明确 backend/React/Vue 实现矩阵 |
| `material_curator` | 输出 `MATERIAL.md` |
| `code_implementer` | 依据计划落代码 |
| `auto_fixer` | 运行验证并修复真实错误 |
| `delivery_auditor` | 最终核对并输出 `DELIVERY.md` |

## 5. 一次标准使用流程

### 5.1 先准备 task slug

推荐格式：

```text
YYYY-MM-DD-short-topic
```

示例：

```text
2026-03-26-user-import
```

### 5.2 初始化任务目录

执行：

```bash
bash .codex/skills/infoq-subagent-delivery/scripts/init_plan_dir.sh 2026-03-26-user-import
```

这个脚本会自动创建：

```text
doc/plan/2026-03-26-user-import/
├── PRD.md
├── DESIGN.md
├── TRS.md
├── MATERIAL.md
└── DELIVERY.md
```

### 5.3 明确告诉 Codex 使用 subagents

注意：

- Codex 不会因为你“好像希望并行”就自动启用 subagents
- 你必须明确说“使用 subagents”或“spawn 对应 agent”

推荐提示词：

```text
请使用 infoq-subagent-delivery 工作流处理这个需求。
任务目录使用 doc/plan/2026-03-26-user-import/。

要求：
1. spawn requirements_expert 完成 PRD.md
2. spawn product_designer 完成 DESIGN.md
3. spawn technical_designer 和 material_curator，分别完成 TRS.md 和 MATERIAL.md
4. spawn code_implementer 按计划实现 backend、React、Vue 需要改动的部分
5. spawn auto_fixer 跑相关验证并修复真实问题
6. spawn delivery_auditor 输出 DELIVERY.md

请等待所有必要子任务完成后再汇总。
如果某个端不需要改动，必须在 TRS.md 和 DELIVERY.md 中明确写出原因。
```

## 6. 推荐执行顺序

建议按以下依赖顺序运行：

```text
requirements_expert
  -> product_designer
    -> technical_designer
    -> material_curator
      -> code_implementer
        -> auto_fixer
          -> delivery_auditor
```

说明：

- `technical_designer` 和 `material_curator` 可以在 `DESIGN.md` 完成后并行
- 其余阶段建议按依赖串行
- `code_implementer` 之前，计划文档必须已经足够明确

## 7. 文档应该怎么写

### 7.1 PRD.md

必须说清楚：

- 核心业务目标
- 用户角色与场景
- 主流程
- 本次范围与非目标
- 验收契约
- 风险、阻塞、待确认问题
- 明确延期到后续阶段的事项

### 7.2 DESIGN.md

必须说清楚：

- 页面或交互入口
- 布局结构
- 用户操作流程
- 加载、空态、错误态、无权限态
- 对 backend/React/Vue 的设计约束

### 7.3 TRS.md

必须说清楚：

- backend/React/Vue 三端实现矩阵
- 后端 API 与数据校验
- 前端页面、路由、状态管理、API 对接
- 验证命令
- 观测点、日志与回滚条件

### 7.4 MATERIAL.md

必须说清楚：

- mock data
- 占位文案
- 图标建议
- 反馈文案

### 7.5 DELIVERY.md

必须说清楚：

- 是否真正覆盖了 PRD 核心需求
- 三端分别交付了什么
- 实际跑了哪些验证
- 残余风险与未完成项
- 配置/SQL/依赖影响
- 回滚条件

## 8. 三端闭环要求

本仓库的 subagent 工作流默认覆盖三个工作区：

- `infoq-scaffold-backend`
- `infoq-scaffold-frontend-react`
- `infoq-scaffold-frontend-vue`

这不代表每个需求都必须同时改三端，而是：

- 每个需求都必须显式评估三端是否受影响
- 如果不改某一端，必须写出理由
- 不允许“默认跳过某一端但文档里不说明”

## 9. 验证与交付要求

建议按以下顺序验证：

1. 主流程验证
2. 针对性测试
3. lint/build
4. diff review

当某个工作区被改动时，最低建议如下：

- Backend：受影响模块的 Maven 测试与编译
- React：`pnpm test`、`pnpm build`
- Vue：`pnpm test:unit`、`pnpm run build:prod`

如果某项验证无法执行，必须：

- 在 `DELIVERY.md` 中记录原因
- 明确它是 blocker、延期项，还是环境限制

不能：

- 假装验证通过
- 为了过检查而添加假成功路径
- 把真正失败的问题写成“已完成”

## 10. 常见误区

### 10.1 把真实任务文档写进 `doc/agents/`

这是错误的。

`doc/agents/` 只放模板，真实任务内容必须写到 `doc/plan/<task-slug>/`。

### 10.2 没有明确要求 spawn subagents

这是错误的。

如果你没有明确说明“使用 subagents”或“spawn 某个 agent”，Codex 很可能还是按单 agent 方式工作。

### 10.3 只写后端，不评估 React 和 Vue

这是错误的。

即使需求最终只改后端，也必须在 `TRS.md` 和 `DELIVERY.md` 里写清楚 React 和 Vue 为什么不改。

### 10.4 没有验收契约就直接开始写代码

这是错误的。

需求范围、非目标、异常处理、验证证据、回滚条件必须先明确，再进入实现。

### 10.5 自动修复阶段只“看代码”不跑验证

这是错误的。

`auto_fixer` 的职责是检查真实错误并修复，不是只做静态阅读。

## 11. 一个完整示例

可直接参考的示例任务目录：

- `doc/plan/2026-03-26-demo-user-import/`

```text
用户：请用 subagents 实现“用户导入”功能，覆盖 backend、React、Vue，并把真实计划文档写到 doc/plan。

Codex：
1. 先创建 task slug，例如 2026-03-26-user-import
2. 执行 init_plan_dir.sh 初始化任务目录
3. spawn requirements_expert 完成 PRD
4. spawn product_designer 完成 DESIGN
5. spawn technical_designer / material_curator 完成 TRS / MATERIAL
6. spawn code_implementer 落代码
7. spawn auto_fixer 跑验证并修复问题
8. spawn delivery_auditor 输出 DELIVERY
9. 汇总最终状态、验证结果、残余风险
```

## 12. 后续规划边界

当前阶段只实现“仓库内 Codex 协作能力”。

后续如果要进入业务系统页面/API，应单独立项，至少补以下能力：

1. 任务创建接口
2. 任务状态流转
3. 文档产物归档与查看
4. 重试与人工接管
5. 页面化查看 `PRD / DESIGN / TRS / MATERIAL / DELIVERY`

## 13. 参考资料

- OpenAI Codex Subagents: <https://developers.openai.com/codex/subagents>
- 仓库内统一入口 skill：`.codex/skills/infoq-subagent-delivery/SKILL.md`
- 模板说明：`doc/agents/README.md`
- 任务产物说明：`doc/plan/README.md`
