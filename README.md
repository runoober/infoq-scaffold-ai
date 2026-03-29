<div align="center">

<img src="doc/images/logo.png" width="120" alt="InfoQ-Scaffold-AI Logo" />

# InfoQ-Scaffold-AI

> 一个以 AI 为主力研发者的全栈工程脚手架。仓库通过 `AGENTS.md` 约束协作规则，通过 `.agents/skills` 固化自动化 SOP，并以 `OpenSpec` 管理长期规格与变更，将能力落到 Spring Boot 3 后端、Vue 3 管理端、React 19 管理端、脚本、SQL、MCP 与文档工作区中。

![Version](https://img.shields.io/badge/Version-2.0.3-f66a39)
![JDK](https://img.shields.io/badge/JDK-17-1677FF)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.10-6DB33F)
![Vue](https://img.shields.io/badge/Vue-3.5.30-42B883)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.11.9-409EFF)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB)
![Ant Design](https://img.shields.io/badge/Ant%20Design-6.3.3-1677FF)
![License](https://img.shields.io/badge/License-MIT-F7C948)

</div>

---

## 项目简介

`infoq-scaffold-ai` 是一个把 AI 协作规则、自动化 SOP、OpenSpec 规格资产、业务代码、验证流程和交付证据放进同一仓库闭环的全栈脚手架。这个仓库不把 AI 当成“代码补全工具”，而是把它当成遵循规约、执行验证、维护规格与文档的工程参与者。

当前仓库同时包含：

- Spring Boot 3.5 多模块后端
- Vue 3 + Element Plus 管理端
- React 19 + Ant Design 管理端
- 根级与工作区级 `AGENTS.md`
- `OpenSpec` 规格与变更目录
- 项目级 MCP 配置与使用文档
- 部署脚本、SQL 初始化脚本、交付与协作文档

## 项目定位

本项目面向三个核心场景：

1. **AI-first 工程协作**：通过根级和工作区级 `AGENTS.md`、skills、`OpenSpec`、MCP 让 Codex 先对齐规格、再做修改、最后执行验证。
2. **双前端后台基线**：同时提供 Vue 3 + Element Plus 与 React 19 + Ant Design 两套管理端实现。
3. **可运行、可验证、可部署**：本地联调、单元测试、浏览器验证、Docker Compose 部署和版本升级都在同一仓库闭环完成。

## 仓库结构

```text
infoq-scaffold-ai
├── AGENTS.md                           # 根级 AI 协作规则与技能路由
├── .agents/skills                      # 仓库级 skills 与脚本化 SOP
├── .codex/config.toml                  # 项目级 Codex / MCP 配置
├── openspec                            # 当前规格、活跃变更与项目级上下文
├── infoq-scaffold-backend              # Spring Boot 3 多模块后端
│   ├── infoq-admin                     # 启动入口与 API 聚合
│   ├── infoq-core                      # BOM / common / data
│   ├── infoq-modules                   # 业务模块（当前以 system 为主）
│   └── infoq-plugin                    # 插件化能力模块
├── infoq-scaffold-frontend-vue         # Vue 3 + Element Plus 管理端
├── infoq-scaffold-frontend-react       # React 19 + Ant Design 管理端
├── script                              # 部署、Compose 与辅助脚本
├── sql                                 # 初始化 SQL
└── doc                                 # 协作、部署、MCP 与扩展文档
```

## 技术栈

| 维度 | 技术栈 |
| --- | --- |
| AI 协作层 | Codex、`AGENTS.md`、`.agents/skills`、`OpenSpec`、`.codex/config.toml` |
| 后端 | Spring Boot `3.5.10`、JDK `17`、MyBatis-Plus `3.5.16`、Sa-Token `1.44.0` |
| Vue 管理端 | Vue `3.5.30`、TypeScript、Vite `6.4.1`、Element Plus `2.11.9`、Vitest |
| React 管理端 | React `19.2.4`、TypeScript、Vite `7.3.1`、Ant Design `6.3.3`、React Router `7.13.1`、Vitest |
| 存储与中间件 | MySQL 8、Redis 7、MinIO |
| 验证与自动化 | Maven、pnpm、浏览器自动化、Chrome DevTools MCP、Context7、OpenAI Docs MCP |

## AI 协作资产

### 1. `AGENTS.md` 分层规则

- 根规则：[`AGENTS.md`](./AGENTS.md)
- 后端规则：[`infoq-scaffold-backend/AGENTS.md`](./infoq-scaffold-backend/AGENTS.md)
- Vue 规则：[`infoq-scaffold-frontend-vue/AGENTS.md`](./infoq-scaffold-frontend-vue/AGENTS.md)
- React 规则：[`infoq-scaffold-frontend-react/AGENTS.md`](./infoq-scaffold-frontend-react/AGENTS.md)

规则采用“越靠近代码越优先”的覆盖方式。跨仓库规则放在根级，技术栈和验证边界放在各工作区。

### 2. `.agents/skills`

仓库内已经沉淀了后端单测、前端单测、双前端浏览器验证、本地联调、版本升级、插件引入、项目参考、OpenSpec subagent 交付等 skills。详细说明见：

- [`doc/skills-guide.md`](./doc/skills-guide.md)
- [`doc/agents-guide.md`](./doc/agents-guide.md)
- [`doc/subagents-guide.md`](./doc/subagents-guide.md)

### 3. `OpenSpec`

新的规格主流程统一放在 `openspec/`：

- 项目级长期上下文：[`openspec/project.md`](./openspec/project.md)
- 当前真相规格：[`openspec/specs/README.md`](./openspec/specs/README.md)
- 已落地的治理规格示例：[`openspec/specs/platform-governance/spec.md`](./openspec/specs/platform-governance/spec.md)
- 活跃变更与归档：[`openspec/changes/README.md`](./openspec/changes/README.md)

默认的 OpenSpec 交付入口是 `infoq-openspec-delivery`，其产物围绕 `proposal.md`、`design.md`、`tasks.md` 和 spec deltas。新的功能、行为变更或跨工作区任务，先在 `openspec/changes/<change-id>/` 建立或定位 change，再开始实现。

可直接参考的 demo change：

- [`openspec/changes/demo-user-import-openspec/proposal.md`](./openspec/changes/demo-user-import-openspec/proposal.md)
- [`openspec/changes/demo-user-import-openspec/design.md`](./openspec/changes/demo-user-import-openspec/design.md)
- [`openspec/changes/demo-user-import-openspec/tasks.md`](./openspec/changes/demo-user-import-openspec/tasks.md)
- [`openspec/changes/demo-user-import-openspec/review.md`](./openspec/changes/demo-user-import-openspec/review.md)

#### OpenSpec 快速上手

1. 选一个 change id，例如 `enhance-user-import`
2. 初始化 change 目录：

```bash
bash .agents/skills/infoq-openspec-delivery/scripts/init_change_dir.sh enhance-user-import
```

3. 然后直接告诉 Codex：

```text
请使用 infoq-openspec-delivery 工作流处理这个需求。
change id: enhance-user-import
先完善 proposal.md 和 tasks.md，再开始实现。
```

4. 如果你明确需要 subagents，再补充：

```text
请使用 subagents。

要求：
1. spawn requirements_expert 生成 proposal.md 和 spec deltas
2. 如涉及 UI/交互，spawn product_designer 生成 design.md
3. spawn technical_designer 生成 tasks.md
4. 如涉及占位文案、mock data 或图标建议，再 spawn material_curator
5. spawn code_implementer 按计划实现 backend、React、Vue 需要改动的部分
6. spawn auto_fixer 跑相关验证并修复真实问题
7. spawn delivery_auditor 复核并在可行时归档 change
```

如果本地已安装 `OpenSpec` CLI，可额外使用：

```bash
openspec validate enhance-user-import
openspec archive enhance-user-import --yes
```

如果尚未安装 CLI，也可以先按仓库内 skill 工作流完成 proposal、tasks、实现与验证，再决定是否补归档。

如需关闭 OpenSpec CLI 的匿名遥测提示，可设置：

```bash
export OPENSPEC_TELEMETRY=0
```

### 4. 项目级 MCP

项目级 Codex MCP 配置已写入 [`.codex/config.toml`](./.codex/config.toml)。

当前默认启用：

- `playwright`
- `context7`
- `openai-docs`
- `chrome-devtools`

当前待选项：

- `figma-desktop`
- `github`

详细说明、启用条件与使用场景见：

- [`doc/mcp-servers.md`](./doc/mcp-servers.md)

## 环境要求

本地开发或验证建议满足以下基线：

| 组件 | 基线 |
| --- | --- |
| JDK | 17 |
| Maven | 3.9+ |
| Node.js | `>= 20.19.0` |
| pnpm | `>= 10.0.0` |
| MySQL | 8.x |
| Redis | 7.x |
| Docker Compose | 仅在脚本化部署时需要 |

补充说明：

- 后端默认本地端口为 `8080`
- 本地开发环境的数据库、Redis 与接口加密配置以 `application-dev.yml` 和前端 `.env.development` 为准
- 生产环境不要直接保留仓库中的示例密钥、示例密码与默认配置

## 快速开始

### 1. 准备后端依赖

至少准备以下本地依赖：

- MySQL
- Redis

初始化 SQL 文件：

- [`sql/infoq_scaffold_2.0.0.sql`](./sql/infoq_scaffold_2.0.0.sql)

后端开发配置参考：

- [`infoq-scaffold-backend/infoq-admin/src/main/resources/application.yml`](./infoq-scaffold-backend/infoq-admin/src/main/resources/application.yml)
- [`infoq-scaffold-backend/infoq-admin/src/main/resources/application-dev.yml`](./infoq-scaffold-backend/infoq-admin/src/main/resources/application-dev.yml)

### 2. 启动后端

```bash
cd infoq-scaffold-backend
mvn spring-boot:run -pl infoq-admin
```

默认本地访问：

- 后端：`http://127.0.0.1:8080`
- 验证码接口：`http://127.0.0.1:8080/auth/code`

### 3. 启动前端

#### 方式 A：工作区直接启动

Vue：

```bash
cd infoq-scaffold-frontend-vue
pnpm install
pnpm run dev
```

React：

```bash
cd infoq-scaffold-frontend-react
pnpm install
pnpm run dev
```

说明：

- 两个工作区的 `.env.development` 当前都默认使用端口 `80`
- 如果你要同时直接运行 Vue 和 React，请手动覆盖端口，或使用下面的仓库级联调脚本

#### 方式 B：仓库级联调脚本

Vue 联调：

```bash
bash .agents/skills/infoq-vue-run-dev-stack/scripts/start_vue_dev_stack.sh
```

React 联调：

```bash
bash .agents/skills/infoq-react-run-dev-stack/scripts/start_react_dev_stack.sh
```

这组脚本的默认行为：

- 后端：`8080`
- Vue：`127.0.0.1:5173`
- React：`127.0.0.1:5174`

停止联调服务：

```bash
bash .agents/skills/infoq-vue-run-dev-stack/scripts/stop_vue_dev_stack.sh
bash .agents/skills/infoq-react-run-dev-stack/scripts/stop_react_dev_stack.sh
```

## 常用命令

### 后端

```bash
cd infoq-scaffold-backend

# 开发运行
mvn spring-boot:run -pl infoq-admin

# dev 打包
mvn clean package -P dev

# 定向测试
mvn -pl infoq-modules/infoq-system -am -DskipTests=false test
```

### Vue 管理端

```bash
cd infoq-scaffold-frontend-vue

pnpm install
pnpm run dev
pnpm run test:unit
pnpm run test:unit:coverage
pnpm run lint:eslint:fix
pnpm run build:prod
```

### React 管理端

```bash
cd infoq-scaffold-frontend-react

pnpm install
pnpm run dev
pnpm run test
pnpm run test:coverage
pnpm run lint:fix
pnpm run build:prod
```

## 部署入口

### 后端与依赖服务

```bash
bash script/bin/infoq.sh deploy
```

支持的主要子命令：

- `prepare`
- `package`
- `build-image`
- `deploy`
- `start`
- `stop`
- `restart`
- `status`
- `logs`

### 前端与网关

```bash
bash script/bin/deploy-frontend.sh deploy
```

该脚本会部署：

- `infoq-frontend-vue`
- `infoq-frontend-react`
- `nginx-web`

默认入口：

- 网关：`http://localhost/vue/`
- 网关：`http://localhost/react/`
- Vue 直连：`http://localhost:9091`
- React 直连：`http://localhost:9092`

更详细的发布前准备与部署步骤见：

- [`doc/deploy-prerequisites.md`](./doc/deploy-prerequisites.md)
- [`doc/manual-deploy.md`](./doc/manual-deploy.md)
- [`doc/docker-compose-deploy.md`](./doc/docker-compose-deploy.md)

## 验证建议

提交前至少执行对应工作区的最小验证：

- 后端改动：主流程验证 + 定向 Maven 测试
- Vue 改动：`pnpm run test:unit` + `pnpm run build:prod`
- React 改动：`pnpm run test` + `pnpm run build:prod`

如果改动影响浏览器运行态、登录、路由守卫或页面渲染，建议额外使用：

- `playwright`
- `chrome-devtools`
- 仓库内的 Vue / React 浏览器验证 skills

## 项目能力概览

- AI 协作治理：根级 / 工作区级 `AGENTS.md` 与 `.agents/skills`
- 研发自动化：本地联调、登录校验、后端冒烟、浏览器验证、版本升级
- 后端业务基线：认证授权、组织权限、字典参数、通知客户端、OSS、日志与监控
- 双前端交付：Vue 3 + Element Plus 与 React 19 + Ant Design 两套管理端
- 插件化扩展：encrypt、mail、sse、websocket、doc、translation、sensitive、excel、log 等能力模块

## 文档导航

- 协作体系：
  - [`doc/agents-guide.md`](./doc/agents-guide.md)
  - [`doc/skills-guide.md`](./doc/skills-guide.md)
  - [`doc/subagents-guide.md`](./doc/subagents-guide.md)
- MCP：
  - [`doc/mcp-servers.md`](./doc/mcp-servers.md)
- 部署交付：
  - [`doc/deploy-prerequisites.md`](./doc/deploy-prerequisites.md)
  - [`doc/manual-deploy.md`](./doc/manual-deploy.md)
  - [`doc/docker-compose-deploy.md`](./doc/docker-compose-deploy.md)
- 扩展治理：
  - [`doc/plugin-catalog.md`](./doc/plugin-catalog.md)

## 架构图

![架构图](doc/images/架构图.png)

## 演示图例

|  |  |
| --- | --- |
| ![登陆页面](doc/images/登陆页面.png) | ![主页面](doc/images/主页面.png) |
| ![用户管理页面](doc/images/用户管理页面.png) | ![角色管理页面](doc/images/角色管理页面.png) |
| ![菜单管理页面](doc/images/菜单管理页面.png) | ![部门管理页面](doc/images/部门管理页面.png) |
| ![岗位管理页面](doc/images/岗位管理页面.png) | ![字典管理页面](doc/images/字典管理页面.png) |
| ![参数设置页面](doc/images/参数设置页面.png) | ![通知公告页面](doc/images/通知公告页面.png) |
| ![操作日志页面](doc/images/操作日志页面.png) | ![登陆日志页面](doc/images/登陆日志页面.png) |
| ![文件管理页面](doc/images/文件管理页面.png) | ![客户端管理页面](doc/images/客户端管理页面.png) |
| ![在线用户页面](doc/images/在线用户页面.png) | ![缓存监控页面](doc/images/缓存监控页面.png) |

## License

[MIT License](./LICENSE)
