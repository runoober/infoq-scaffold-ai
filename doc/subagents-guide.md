# Subagents 使用指南

## 1. 文档目标

本文档说明如何在 `infoq-scaffold-ai` 仓库内使用 Codex subagents 配合 `OpenSpec` 完成一次完整的需求交付闭环。

适用范围：

- 在仓库内通过 Codex 协作完成需求分析、设计、技术方案、代码实现、自动修复与最终验收
- 覆盖 `infoq-scaffold-backend`、`infoq-scaffold-frontend-react`、`infoq-scaffold-frontend-vue`

不在本文档范围：

- 业务系统里可视化触发 agent 的页面/API
- 任务持久化、运行历史中心、在线重试控制台

## 2. 什么是 Subagents

根据 OpenAI 官方 Codex 文档，multi-agents 适合把噪音较高或职责明确的任务交给专门的子 agent，主线程只保留需求、约束、决策和最终结论。

在本仓库里，subagents 的用途不是“同时让很多 agent 随便发挥”，而是围绕一个 `OpenSpec` change 做明确分工：

1. 需求收集
2. 产品设计
3. 技术设计
4. 素材补充
5. 代码实现
6. 自动修复
7. 验证与归档

## 3. 当前主流程

- 项目级上下文：`openspec/project.md`
- 当前真相规格：`openspec/specs/`
- 活跃变更目录：`openspec/changes/<change-id>/`
- 统一入口 skill：`.agents/skills/infoq-openspec-delivery/`

## 4. 当前可用的专家

仓库当前已定义以下 custom agents：

| Agent | 责任 |
| --- | --- |
| `requirements_expert` | 分析需求，输出 `proposal.md` 和 spec delta |
| `product_designer` | 在有交互或 UI 决策时输出 `design.md` |
| `technical_designer` | 输出 `tasks.md`，明确 backend/React/Vue 实现矩阵和验证命令 |
| `material_curator` | 在需要时输出 `materials.md`，补充 mock、文案、图标建议 |
| `code_implementer` | 依据 `proposal.md`、`design.md`、`tasks.md` 和 spec delta 落代码 |
| `auto_fixer` | 运行验证并修复真实错误 |
| `delivery_auditor` | 复核变更是否 archive-ready，并在有 blocker 时给出明确结论 |

## 5. 一次标准使用流程

### 5.1 先准备 change id

推荐格式：

```text
verb-noun
```

或：

```text
YYYY-MM-DD-short-topic
```

示例：

```text
enhance-user-import
```

### 5.2 初始化 change 目录

执行：

```bash
bash .agents/skills/infoq-openspec-delivery/scripts/init_change_dir.sh enhance-user-import
```

脚本会初始化：

```text
openspec/changes/enhance-user-import/
├── proposal.md
├── tasks.md
└── specs/
```

`design.md` 和 `materials.md` 只在需要时补充。

### 5.3 明确告诉 Codex 使用 subagents

注意：

- Codex 不会因为你“好像希望并行”就自动启用 subagents
- 你必须明确说“使用 subagents”或“spawn 对应 agent”

推荐提示词：

```text
请使用 infoq-openspec-delivery 工作流处理这个需求。
change id: enhance-user-import

要求：
1. spawn requirements_expert 生成 proposal.md 和 spec deltas
2. 如涉及 UI/交互，spawn product_designer 生成 design.md
3. spawn technical_designer 生成 tasks.md
4. 如涉及占位文案、mock data 或图标建议，再 spawn material_curator
5. spawn code_implementer 按计划实现 backend、React、Vue 需要改动的部分
6. spawn auto_fixer 跑相关验证并修复真实问题
7. spawn delivery_auditor 复核并在可行时归档 change

请等待所有必要子任务完成后再汇总。
如果某个端不需要改动，必须在 tasks.md 中明确写出原因。
```

## 6. 推荐执行顺序

建议按以下依赖顺序运行：

```text
requirements_expert
  -> product_designer(optional)
    -> technical_designer
    -> material_curator(optional)
      -> code_implementer
        -> auto_fixer
          -> delivery_auditor
```

说明：

- `product_designer` 不是每次都需要
- `material_curator` 不是每次都需要
- `code_implementer` 之前，`proposal.md`、必要的 `design.md` 和 `tasks.md` 必须已经足够明确

## 7. Active Change 应该怎么写

### 7.1 `proposal.md`

必须说清楚：

- 核心业务目标
- 用户角色与场景
- 主流程
- 本次范围与非目标
- 验收契约
- 风险、阻塞、待确认问题
- 明确延期到后续阶段的事项

### 7.2 `design.md`

只在需要时创建，必须说清楚：

- 页面或交互入口
- 布局结构
- 用户操作流程
- 加载、空态、错误态、无权限态
- 对 backend/React/Vue 的设计约束

### 7.3 `tasks.md`

必须说清楚：

- backend/React/Vue 三端实现矩阵
- 后端 API 与数据校验
- 前端页面、路由、状态管理、API 对接
- 验证命令
- 观测点、日志与回滚条件
- 哪些端不改，以及原因

### 7.4 spec delta

放在：

```text
openspec/changes/<change-id>/specs/<capability>/spec.md
```

必须说清楚：

- 新增需求使用 `ADDED Requirements`
- 变更需求使用 `MODIFIED Requirements`
- 删除需求使用 `REMOVED Requirements`
- 每个 requirement 至少有一个 scenario

### 7.5 `materials.md`

只在需要时创建，可包含：

- mock data
- 占位文案
- 图标建议
- 反馈文案

## 8. 三端闭环要求

本仓库的 subagent 工作流默认评估三个工作区：

- `infoq-scaffold-backend`
- `infoq-scaffold-frontend-react`
- `infoq-scaffold-frontend-vue`

这不代表每个需求都必须同时改三端，而是：

- 每个需求都必须显式评估三端是否受影响
- 如果不改某一端，必须在 `tasks.md` 里写出理由
- 不允许“默认跳过某一端但文档里不说明”

## 9. 验证与归档要求

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

- 在 active change 中记录原因
- 明确它是 blocker、延期项，还是环境限制

不能：

- 假装验证通过
- 为了过检查而添加假成功路径
- 把真正失败的问题写成“已完成”

只有在验证证据充分时，`delivery_auditor` 才应该建议或执行 archive。

## 10. 常见误区

### 10.1 没有先创建 OpenSpec change

这是错误的。

新的功能或行为变更，默认应先创建或定位 `openspec/changes/<change-id>/`，再开始实现。

### 10.2 没有明确要求 spawn subagents

这是错误的。

如果你没有明确说明“使用 subagents”或“spawn 某个 agent”，Codex 很可能还是按单 agent 方式工作。

### 10.3 只写后端，不评估 React 和 Vue

这是错误的。

即使需求最终只改后端，也必须在 `tasks.md` 里写清楚 React 和 Vue 为什么不改。

### 10.4 没有验收契约就直接开始写代码

这是错误的。

无论 change 大小如何，`proposal.md` 里都要先定义 acceptance contract，再进入实现阶段。

补充结构建议：

- `proposal.md` 建议显式包含 `Why` 和 `What Changes` 两个一级章节
- `What Changes` 下再细分范围、非目标和关键影响面

## 11. 可直接参考的 OpenSpec 示例

仓库当前已经提供一份 OpenSpec demo change：

- `openspec/changes/demo-user-import-openspec/`

它的用途是：

- 演示一份完整 OpenSpec change 的组织方式
- 演示 `proposal.md`、`design.md`、`tasks.md`、`materials.md`、`review.md` 的分工
- 演示“未执行真实实现时为什么不能 archive”

注意：

- 该示例是 demo change，不是已完成交付的真实需求
- 如果你要做真实功能，请复制它的结构，而不是直接把它 archive
