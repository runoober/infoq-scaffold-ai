# InfoQ Scaffold AI 项目上下文

## 目标

`infoq-scaffold-ai` 是一个 AI 优先的全栈脚手架。`infoq` 前缀代表框架品牌标识，不是项目私有定制开关。命名共享框架能力、技能与文档时应保留该前缀。

## 工作区映射

- `infoq-scaffold-backend`：Spring Boot 多模块后端
- `infoq-scaffold-frontend-react`：React 19 + Ant Design 管理端
- `infoq-scaffold-frontend-vue`：Vue 3 + Element Plus 管理端
- `infoq-scaffold-frontend-weapp-react`：Taro + React 小程序与 H5 移动端
- `script`：部署、环境与本地 WeChat DevTools 启动脚本
- `sql`：初始化 SQL
- `doc`：参考文档与使用指南

## 架构默认约束

- 后端主链路：`Controller -> Service -> Mapper -> Entity`
- 前端实现必须遵守各工作区本地架构，不得把某一端风格强行套到另一端
- 优先显式失败路径，避免静默回退
- 优先最小改动，避免大范围重写

## 交付默认约束

- L3 变更（新功能、API 契约变更、跨工作区交付）在改代码前必须创建或定位 `openspec/changes/<change-id>/`
- L2 变更（单工作区行为变更且不改 API 契约）可使用 OpenSpec 精简流程，至少维护 `proposal.md` 与 `tasks.md`
- L1 变更（单工作区小修复且不改契约、改动范围小）可不创建 OpenSpec，但必须先写验收约定
- 不确定分级时默认按 L3 执行
- 活跃变更规划放在 `openspec/changes/<change-id>/`
- 当前稳定真值规范放在 `openspec/specs/`
- 执行期间以 `proposal.md`、`tasks.md` 与相关规范增量作为真值
- 每个变更只维护一个验收约定
- 验证顺序固定为：主流程验证 -> 目标测试 -> lint/build -> 差异评审

## 文档与工具默认约束

- OpenSpec 文档正文默认使用中文
- 路径名称、命令、文件名保持英文原样（例如 `openspec/changes/<change-id>/`、`pnpm`、`mvn`、`proposal.md`）
- 前端命令优先使用 `pnpm`
- 后端构建与测试使用 `mvn`
- L3/L2 交付优先使用 `infoq-openspec-delivery` 做 OpenSpec 文档产物编排
- 对重复验证流程优先复用仓库技能
- 仅当用户明确要求子代理或多专家执行时才使用子代理
