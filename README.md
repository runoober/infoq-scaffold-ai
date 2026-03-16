<div align="center">

# InfoQ-Scaffold-AI

> 一个为 Codex 设计的自动化工程仓库：通过 `AGENTS.md` 定义项目规则，通过 `.codex/skills` 注入可复用技能，再把这些能力作用到 Spring Boot 3 后端、Vue 3 管理端和 React 19 管理端，实现“从需求到代码到验证”的自动化研发闭环。

![JDK](https://img.shields.io/badge/JDK-17-1677FF)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.10-6DB33F)
![Vue](https://img.shields.io/badge/Vue-3.5.22-42B883)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.11.7-409EFF)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB)
![Ant Design](https://img.shields.io/badge/Ant%20Design-6.3.2-1677FF)
![License](https://img.shields.io/badge/License-MIT-F7C948)

</div>

---

## 项目定位

`infoq-scaffold-ai` 不是一个只提供代码模板的普通脚手架，它的核心目标是把整个仓库设计成一个对 Codex 友好的自动化工程环境。

这个仓库真正的核心不是单独的后端模块、Vue 管理端或 React 管理端，而是下面这套协作机制：

- 用 `AGENTS.md` 描述项目级高优先级规则、边界、编码约束和技能触发条件。
- 用 `.codex/skills` 把高频研发动作沉淀成可复用的 skill。
- 用 Codex 在真实代码仓库上执行“读取规则 -> 选择技能 -> 检索代码 -> 修改实现 -> 执行验证 -> 输出结果”的闭环。
- 用后端、前端、部署脚本、SQL、文档等工作区承载自动化实现结果。

换句话说，本项目的核心价值是：**让 Codex 能稳定、可控、可重复地参与项目构建、功能实现、验证、联调与文档维护。**

---

## 核心机制

```text
用户需求
  -> Codex 读取 AGENTS.md
  -> 根据任务类型匹配 .codex/skills
  -> 检索真实代码、脚本、配置、SQL、文档
  -> 在对应 workspace 实施修改
  -> 执行构建 / 测试 / 冒烟 / 联调 / 浏览器验证
  -> 返回可复用的实现与交付说明
```

这套机制的关键不是“让 AI 自由发挥”，而是“让仓库主动告诉 Codex 应该怎么做”：

- `AGENTS.md` 负责定义项目操作系统。
- `.codex/skills` 负责提供任务级 SOP。
- `infoq-scaffold-backend`、`infoq-scaffold-frontend-vue`、`infoq-scaffold-frontend-react` 是真实交付目标。
- `script`、`sql`、`doc` 提供部署、数据初始化、辅助文档与验证支撑。

项目在 `AGENTS.md` 顶部明确要求：

- 优先采用 `retrieval-led reasoning`，先读仓库、再做判断。
- 整个项目所有文件统一使用 `UTF-8` 编码。
- 主动避免过度注释、无意义重构、功能蔓延、忽略边界情况和大段替换。
- 不依赖模糊经验推断目录、命令和约定。
- 通过 skill 触发机制把复杂动作变成标准流程。

---

## AGENTS.md 说明

`AGENTS.md` 是这个仓库最重要的项目级入口文件。对于 Codex 来说，它相当于：

- 项目工作说明书
- 技能路由表
- 高优先级工程约束清单
- 轻量级执行协议入口

### 它解决什么问题

如果没有 `AGENTS.md`，Codex 虽然能读代码，但不知道：

- 哪些目录才是本项目真正的工作区
- 用户提到“启动项目”“冒烟测试”“找类名”“新增插件”时应该优先走哪条路径
- 后端和前端各自的命名规范、验证方式、构建命令是什么
- 哪些 skill 需要优先触发，哪些只是补充能力

有了 `AGENTS.md`，这些信息就变成了可检索、可执行的显式规则。现在仓库采用“顶层规约精简 + skill 按需加载”的方式：高优先级全局规则保留在 `AGENTS.md`，静态项目参考信息下沉到 skill。

### 它包含哪些核心信息

| 模块 | 作用 |
| --- | --- |
| `IMPORTANT` | 强制 Codex 先检索仓库，再做判断 |
| `Encoding` | 强制整个项目使用 `UTF-8` 编码 |
| `AI Coding Guardrails` | 约束注释、重构范围、功能边界、异常处理和改动粒度 |
| `Local Skills` / `Skill Trigger` | 定义 skill 名称、触发条件与优先级 |
| `* Skill` 索引行 | 告诉 Codex 到哪些 skill 目录读取具体 SOP |
| `Code Index Refresh` | 规定什么时候必须刷新代码索引 |

仓库结构、入口文件、构建/运行/部署命令、命名规范、PR 约定等稳定但非每轮必需的信息，已经迁移到 `infoq-project-reference` skill，避免让 `AGENTS.md` 持续膨胀。

### 在这个项目里，AGENTS.md 的本质是什么

可以把它理解成一句话：

> `AGENTS.md` 不是补充文档，而是 Codex 进入仓库后的第一层执行协议。

也正因为如此，项目把很多“人脑记忆”转成了“`AGENTS.md` 路由 + skill 内参考资料”的显式索引，例如：

- 哪个任务应该用哪个 skill
- 哪个 skill 负责项目静态参考信息
- 哪个脚本用于启动联调，哪个脚本用于登录检查，哪个脚本用于冒烟验证
- 修改工作区内文件或类名后，什么时候必须刷新代码索引

---

## .codex/skills 说明

`.codex/skills` 是本项目的技能库。它的作用不是“存提示词”，而是把一类可重复任务固化成 Codex 可以调用的执行单元。

### skill 目录通常包含什么

| 目录/文件 | 作用 |
| --- | --- |
| `SKILL.md` | skill 的入口说明、适用场景、执行流程 |
| `references/` | 参考资料、规则说明、官方组件索引、反例、检查清单 |
| `scripts/` | 可直接运行的脚本，用于联调、验证、生成计划或导出结果 |
| `templates/` | 固定模板、命令模板、输出模板 |
| `agents/` | 某些 skill 会附带额外 agent 配置或集成说明 |

### skill 是怎么被触发的

通常有三种方式：

1. 用户在需求里直接点名某个 skill。
2. `AGENTS.md` 的 `Skill Trigger` 命中当前任务语义。
3. Codex 先读 `AGENTS.md`，再根据任务类型选择最匹配的 skill。

### 为什么 skill 是本项目核心资产

因为 skill 把“经验”变成了“可执行流程”。例如：

- 不再临时猜测如何启动联调，而是调用 `infoq-run-dev-stack`
- 不再临时组织登录验证，而是调用 `infoq-login-success-check`
- 不再临时拼凑后端冒烟测试，而是调用 `infoq-backend-smoke-test`
- 不再手工解释 `AGENTS.md` 的压缩规则，而是参考 `agents-md-compress`

这意味着仓库不仅能承载代码，还能承载 Codex 的工作方法。

### 当前仓库内置的关键 skills

| Skill | 用途 | 典型场景 |
| --- | --- | --- |
| `agent-browser` | 通用浏览器自动化 | 打开页面、点击、截图、抓取页面内容、检查控制台错误 |
| `infoq-browser-automation` | 项目专用浏览器自动化 | 本仓库本地联调、注入登录态、按路由验证页面 |
| `infoq-run-dev-stack` | 启动或停止本地联调环境 | 同时启动后端 + Vue，或只启动后端/前端 |
| `infoq-backend-smoke-test` | 后端冒烟验证 | 改完接口、权限、Mapper、认证后做运行态验证 |
| `infoq-login-success-check` | 登录验证 | 检查 `/auth/login`、token 与受保护接口是否正常 |
| `infoq-plugin-introducer` | 插件引入与治理 | 新增插件、插件开关化、插件模块拆分 |
| `infoq-codebase-index` | 仓库索引与快速定位 | 查文件、找类、找组件、改名后刷新索引 |
| `infoq-project-reference` | 项目静态参考信息 | 查目录结构、入口/配置文件、构建/部署命令、命名/提交流程约定 |
| `ant-design-component-reference` | React + Ant Design 官方组件参考 | 用 antd 实现 React 页面或核对 API |
| `element-plus-component-reference` | Vue + Element Plus 官方组件参考 | 用 Element Plus 实现 Vue 页面或核对 API |
| `agents-md-compress` | 维护 AGENTS 规则索引 | 更新、压缩、规范化 `AGENTS.md` |
| `infoq-backend-unit-test-patterns` | 后端测试模式沉淀 | 扩展 JUnit / MyBatis / service / controller 测试 |
| `infoq-frontend-unit-test-patterns` | Vue 前端测试模式沉淀 | 为 Vue3 + Vite6 项目补充可重复测试 |
| `skill-creator` | 创建或演进新 skill | 新增 skill、优化 skill 触发描述、迭代技能能力 |

---

## 自动化工作流示例

下面这些场景最能体现本仓库的价值。

| 用户需求 | Codex 在仓库中的典型动作 |
| --- | --- |
| “启动后端和 Vue 前端，帮我做本地联调” | 读取 `AGENTS.md`，触发 `infoq-run-dev-stack`，按脚本启动服务并检查状态 |
| “新增一个可开关插件，并同步前后端接入” | 触发 `infoq-plugin-introducer`，定位后端插件模块、前端接入点、配置开关与验证路径 |
| “用 Element Plus 实现一个系统管理页面” | 触发 `element-plus-component-reference`，确认组件选择与 API，再修改 Vue 页面代码 |
| “改完权限或 Mapper 后做运行态验证” | 触发 `infoq-backend-smoke-test` 与 `infoq-login-success-check`，执行登录和受保护接口链路校验 |
| “帮我找某个 service、路由、组件或 API 文件” | 触发 `infoq-codebase-index`，先查索引，再读真实源码定位 |
| “更新 AGENTS 规则或维护 skill 体系” | 触发 `agents-md-compress` 或 `skill-creator`，维护项目级协议与能力库 |

如果把这个项目看成一个系统，那么可以简化为：

- `AGENTS.md` 负责“告诉 Codex 该遵守什么规则”
- `.codex/skills` 负责“告诉 Codex 该怎么做这类事，以及在需要时加载哪些项目参考信息”
- 仓库代码负责“承接最终实现”

---

## 仓库结构

```text
infoq-scaffold-ai
├── AGENTS.md                         # 项目级执行协议、索引与触发规则
├── .codex/skills                     # Codex 技能库
├── infoq-scaffold-backend            # Spring Boot 3 多模块后端
│   ├── infoq-admin                   # 启动入口与 API 聚合
│   ├── infoq-core                    # 通用内核
│   ├── infoq-modules                 # 业务模块
│   └── infoq-plugin                  # 插件化能力模块
├── infoq-scaffold-frontend-vue       # Vue 3 + Element Plus 管理端
├── infoq-scaffold-frontend-react     # React 19 + Ant Design 管理端
├── script                            # 部署与本地联调脚本
├── sql                               # 数据库初始化脚本
└── doc                               # 补充文档、架构图、导图源稿
```

当前项目基线版本：`2.0.0`

---

## 快速开始

### 1. 环境准备

- 支持 `AGENTS.md` 与本地 skills 的 Codex 运行环境
- JDK 17+
- Maven 3.9+
- Node.js >= 20
- npm >= 10
- pnpm
- MySQL 8、Redis 7、MinIO
- Docker / Docker Compose（如果使用脚本化部署）

### 2. 获取代码

```bash
git clone https://github.com/LuckyKuang/infoq-scaffold-ai.git
cd infoq-scaffold-ai
```

### 3. 安装 npm 与 pnpm

如果本机已经安装了 Node.js 20+，通常已经自带 `npm`。为了避免版本过旧，可以先升级 `npm`，再安装 `pnpm`：

```bash
# 升级 npm
npm install -g npm@latest
npm -v

# 安装 pnpm
npm install -g pnpm
pnpm -v
```

后续前端依赖安装、开发、lint、test、build 统一使用 `pnpm`。对于中国大陆网络环境，这通常比直接使用 `npm` 更利于加速依赖安装与构建。

如果某些服务器、本地环境或旧容器里暂时没有 `pnpm`，再回退到等价的 `npm` 命令即可，例如 `pnpm install -> npm install`、`pnpm run build:prod -> npm run build:prod`。

### 4. 初始化数据库

```bash
mysql -u root -p < sql/infoq_scaffold_2.0.0.sql
```

如果使用仓库脚本或 Docker Compose，首次空数据目录启动时也会自动导入该 SQL。

### 5. 检查关键配置

建议至少检查以下文件：

- `infoq-scaffold-backend/infoq-admin/src/main/resources/application.yml`
- `infoq-scaffold-backend/infoq-admin/src/main/resources/application-dev.yml`
- `infoq-scaffold-frontend-vue/.env.development`
- `infoq-scaffold-frontend-react/.env.development`

需要重点确认：

- 数据源、Redis、OSS / MinIO 地址
- `api-decrypt.enabled`、`sse.enabled`、`websocket.enabled` 等功能开关
- 前后端本地联调端口

### 6. 推荐的 Codex 使用方式

进入仓库后，不要只给 Codex 一个模糊目标，最好把目标、工作区、验证要求说清楚。下面是适合本仓库的典型输入：

```text
请先阅读 AGENTS.md，启动后端和 Vue 前端做本地联调，并告诉我访问地址。

请基于现有插件治理方式新增一个可开关插件，后端和前端都要接入，改完后执行验证。

请用 Element Plus 在用户管理页新增批量导入功能，完成后执行 pnpm run lint:eslint:fix 和 pnpm run build:prod。

请帮我定位某个 service、mapper、路由和页面组件分别在哪些文件里。
```

### 7. 也可以手工执行关键脚本

```bash
# 启动本地联调
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh

# 验证登录
bash .codex/skills/infoq-login-success-check/scripts/verify_login.sh

# 后端冒烟测试
bash .codex/skills/infoq-backend-smoke-test/scripts/run_smoke.sh
```

---

## 常用命令

### 后端

```bash
cd infoq-scaffold-backend

# 编译打包
mvn clean package -P dev -pl infoq-admin -am

# 本地运行
mvn spring-boot:run -pl infoq-admin

# 系统模块测试
mvn test -pl infoq-modules/infoq-system -DskipTests=false
```

### Vue 管理端

```bash
cd infoq-scaffold-frontend-vue
pnpm install
pnpm run lint:eslint:fix
pnpm run build:prod
```

### React 管理端

```bash
cd infoq-scaffold-frontend-react
pnpm install
pnpm run lint
pnpm run build:prod
```

### 部署

```bash
# 后端部署
bash script/bin/infoq.sh deploy

# 前端部署
bash script/bin/deploy-frontend.sh deploy
```

### 索引刷新

当你新增、删除、重命名、移动以下工作区内的文件或类名时，应该刷新索引：

- `infoq-scaffold-backend`
- `infoq-scaffold-frontend-react`
- `infoq-scaffold-frontend-vue`

执行命令：

```bash
python3 .codex/skills/infoq-codebase-index/scripts/sync_indexes.py
```

---

## 如何扩展新的 skill

如果你希望项目越来越“适合 Codex 自动化协作”，新增 skill 是最直接的方式。

推荐做法：

1. 在 `.codex/skills/<skill-name>/` 下创建 skill 目录。
2. 编写 `SKILL.md`，明确适用场景、执行流程、边界和校验方式。
3. 按需补充 `references/`、`scripts/`、`templates/`。
4. 如果这个 skill 需要自动触发，把触发规则补充进 `AGENTS.md`。
5. 如果这些信息属于“稳定但非高优先级常驻规则”，优先沉淀到 skill 的 `references/`，不要继续堆进 `AGENTS.md`。
6. 如果 skill 会影响代码定位或工作区结构，记得刷新 `infoq-codebase-index`。

这个过程的目标不是“多写一份文档”，而是把团队的高频研发动作固化成仓库内置能力。

---

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 后端 | Spring Boot 3.5.10、JDK 17、MyBatis-Plus 3.5.16、Sa-Token 1.44.0、Redisson 3.52.0 |
| Vue 前端 | Vue 3、TypeScript、Vite 6、Element Plus |
| React 前端 | React 19、Ant Design 6 |
| 基础设施 | MySQL 8、Redis 7、MinIO、Nginx、Docker Compose |

---

## 相关文档

- [插件目录与开关策略](./doc/plugin-catalog.md)
- [Docker Compose 部署说明](./doc/docker-compose-deploy.md)

---

## License

[MIT License](./LICENSE)
