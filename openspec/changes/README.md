# OpenSpec 活跃变更目录

活跃工作统一放在 `openspec/changes/<change-id>/`。

## 推荐目录结构

```text
openspec/changes/<change-id>/
├── proposal.md
├── design.md            # 可选
├── tasks.md
├── materials.md         # 可选
├── review.md            # 可选：归档受阻或需要书面审计记录时使用
└── specs/
    └── <capability>/spec.md
```

## 编写规则

- `proposal.md` 应包含背景、变更内容、验收约定与风险说明
- `design.md` 仅在用户体验或技术权衡需要长期决策记录时必填
- `tasks.md` 是执行清单与验证真值来源
- `materials.md` 为可选项，仅在文案/模拟数据/图标指引确有价值时编写
- `review.md` 为可选项，仅在审计受阻或需要明确书面验收总结时编写
- 规范增量放在当前变更目录下的 `specs/`
- 只有在验证证据完整后才允许归档或合并
- OpenSpec 文档正文默认中文；路径名称、命令、文件名保持英文

## 预置示例

- `openspec/changes/demo-user-import-openspec/`：未归档示例变更，展示如何表达 proposal、design、tasks、materials、review 以及 user-management 规范增量，并明确该示例不代表已交付代码
- `openspec/changes/archive/`：已接受变更的归档目录（其更新已回写到 `openspec/specs/`）
