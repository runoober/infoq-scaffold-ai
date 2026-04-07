# OpenSpec 真值规范目录

`openspec/specs/` 用于存放仓库中“稳定行为”的当前真值规范。

## 使用准则

- 按业务能力组织规范，不按后端/React/Vue 工作区拆分
- 仅在活跃变更被接受后，才更新真值规范
- 要求描述必须具体、可验证、以场景驱动
- 规范中的约束语句统一使用“必须”

## 建议的能力目录

- `auth/`
- `user-management/`
- `menu-permission/`
- `notification/`
- `file-storage/`
- `platform-governance/`

## 当前预置规范

- `platform-governance/spec.md`：默认交付流程、跨工作区评估、归档门禁与 OpenSpec 文档语言规范
