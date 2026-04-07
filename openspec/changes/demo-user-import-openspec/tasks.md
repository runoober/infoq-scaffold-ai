# 任务：demo-user-import-openspec

## 规划

- [x] 为“用户导入”能力提供一份完整 OpenSpec 演示变更
- [x] 在 `proposal.md` 中记录验收约定与“仅演示”范围
- [x] 在 `specs/user-management/spec.md` 中补充用户导入规范增量

## 后端

- [x] 确认后端参考路径：`infoq-scaffold-backend/infoq-modules/infoq-system/src/main/java/cc/infoq/system/controller/system/SysUserController.java`
- [x] 记录演示用途下的现有 API 参考：
  - `POST /system/user/importData`
  - `POST /system/user/importTemplate`
- [x] 明确本示例不修改后端代码
- [ ] 真实实现变更时，执行有针对性的后端测试并落实必要调整

## React

- [x] 确认 React 参考路径：`infoq-scaffold-frontend-react/src/pages/system/user/index.tsx`
- [x] 记录当前“用户导入弹窗 + 模板下载 + `updateSupport`”行为作为参考 UX
- [x] 明确本示例不修改 React 代码
- [ ] 真实实现变更时，改动后执行 `pnpm test` 与 `pnpm build`

## Vue

- [x] 确认 Vue 参考路径：`infoq-scaffold-frontend-vue/src/views/system/user/index.vue`
- [x] 记录当前 `el-upload` 对话框流程作为参考 UX
- [x] 明确本示例不修改 Vue 代码
- [ ] 真实实现变更时，改动后执行 `pnpm test:unit` 与 `pnpm run build:prod`

## 材料

- [x] 在 `materials.md` 中记录模拟数据、占位文案、图标建议与反馈文案
- [x] 明确哪些占位内容在生产实现前必须替换

## 验证

- [x] 定义主流程验证预期：
  - 模板下载
  - 文件上传
  - `updateSupport` 开关
  - 成功与失败反馈
- [x] 定义目标测试命令：
  - `cd infoq-scaffold-backend && mvn test -pl infoq-modules/infoq-system -DskipTests=false`
  - `cd infoq-scaffold-frontend-react && pnpm test && pnpm build`
  - `cd infoq-scaffold-frontend-vue && pnpm test:unit && pnpm run build:prod`
- [x] 记录本示例刻意不执行上述命令
- [x] 在 `review.md` 中记录残余阻塞，避免该变更被误判为可归档实现
