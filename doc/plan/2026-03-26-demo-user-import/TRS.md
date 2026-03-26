# TRS

## 1. 技术目标

- 对应业务目标：把现有“用户导入”能力整理成一套可被 subagents 复用的计划与交付样例
- 对应设计目标：保持 backend、React、Vue 三端在导入能力描述上的一致性

## 2. 实现矩阵

| Workspace | 是否改动 | 说明 |
| --- | --- | --- |
| `infoq-scaffold-backend` | 是 | 已存在用户导入与模板下载接口，可作为示例引用对象 |
| `infoq-scaffold-frontend-react` | 是 | 已存在用户导入弹窗，可作为示例引用对象 |
| `infoq-scaffold-frontend-vue` | 是 | 已存在用户导入弹窗，可作为示例引用对象 |

## 3. 后端设计

- 模块与包路径：`infoq-scaffold-backend/infoq-modules/infoq-system`
- RESTful API：
  - `POST /system/user/importData`
  - `POST /system/user/importTemplate`
- 请求/响应模型：
  - 上传请求：`multipart/form-data`，包含 `file` 与 `updateSupport`
  - 响应：返回导入分析结果
- 数据校验：文件格式仅允许 Excel 导入；导入结果按监听器分析
- 权限控制：`system:user:import`
- 日志/审计：导入动作应记录为导入类业务日志
- 失败处理：解析失败、数据校验失败、权限不足都必须显式返回失败结果

## 4. React 设计

- 页面/路由入口：`src/pages/system/user/index.tsx`
- API 适配：导入提交与模板下载通过现有用户模块请求能力完成
- 状态管理：本地组件状态保存文件列表与 `updateSupport`
- 组件拆分：当前可沿用导入弹窗实现，不必先拆独立页面
- 异常态处理：无文件禁止提交；上传失败显示失败提示；模板下载失败显示错误反馈

## 5. Vue 设计

- 页面/路由入口：`src/views/system/user/index.vue`
- API 适配：通过 `upload.url` 指向 `/system/user/importData`，模板下载走 `importTemplate`
- 状态管理：`upload` 响应式对象管理弹窗、headers、`updateSupport`
- 组件拆分：当前可沿用弹窗 + `el-upload` 实现
- 异常态处理：上传中禁用重复提交；失败时显示明确提示

## 6. 数据与素材依赖

- 依赖 `MATERIAL.md` 的项：模板字段示例、上传说明文案、空态/错误态提示
- Mock / placeholder 替换策略：本示例中的 mock 文件列头与提示文案仅作为写法示范，真实实现时可按业务扩展

## 7. 验证方案

- Main-flow verification：手动验证模板下载、文件上传、覆盖开关、成功/失败反馈
- Backend targeted tests：`cd infoq-scaffold-backend && mvn test -pl infoq-modules/infoq-system -DskipTests=false`
- React checks：`cd infoq-scaffold-frontend-react && pnpm test && pnpm build`
- Vue checks：`cd infoq-scaffold-frontend-vue && pnpm test:unit && pnpm run build:prod`
- Build/lint：按受影响工作区补充 lint/build

## 8. 风险、观察与回滚

- 风险点：三端文案或错误提示不一致；导入结果反馈过于粗糙
- 观测点 / 必要日志：导入请求结果、失败原因、上传耗时、模板下载失败
- 回滚条件：若后续真实增强导致现有用户导入能力回退、报错或权限失效，应立即回滚对应改动
