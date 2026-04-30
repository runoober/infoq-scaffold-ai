---
name: infoq-ant-design-component-reference
description: 参考 Ant Design 官方文档进行组件选型并实现 React UI，确保 API 用法与版本兼容性正确。当需求提到 Ant Design/antd 组件、构建或重构包含表单/表格/弹窗的 React 页面，或需要确认当前 antd 版本是否支持某个组件与特性时使用。
---

# InfoQ Ant Design 组件参考

以 Ant Design 官方文档作为组件选型与 API 使用的真值来源。
先阅读 `references/component-overview-zh-cn.md`，编码前再确认组件级 API。

## 工作流程

1. 对 UI 需求进行分类。
2. 从官方总览索引中挑选候选组件。
3. 编码前核对组件 API。
4. 结合 `package.json` 或 lockfile 检查本地 antd 版本兼容性。
5. 若任务转为 React admin 构建告警、chunk 拆分、入口包体或 `manualChunks` 优化，不要继续当成组件选型问题；切换到 `infoq-project-reference`，并以 `infoq-scaffold-frontend-react/vite.config.ts` 当前分包策略为真值。
6. 处理 antd 相关构建体积问题时，不要默认回到按 `antd/es/*` 或 `antd/lib/*` 细拆；本仓库当前基线是保留路由懒加载，并只对稳定的 rc 重模块做 vendor 分组。
7. 实现 React 代码时，尽量减少自定义 CSS 覆盖。
8. 验证加载态、空态、错误态、禁用态和破坏性操作态。

## 参考资源

- `references/component-overview-zh-cn.md`
- `references/component-selection-playbook.md`
