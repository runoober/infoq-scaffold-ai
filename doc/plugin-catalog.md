# 插件目录与开关策略

## 1. 目标与范围

本文档用于统一 `infoq-scaffold-ai` 的插件治理策略，满足以下目标：

1. 框架核心能力固定保留，避免误删导致系统不可用。
2. 可选插件通过配置快速开启/关闭，尽量不改业务代码。
3. 通用插件可被未来新增业务模块直接引用，降低接入成本。

适用目录：

- 后端：`infoq-scaffold-backend/infoq-plugin`、`infoq-scaffold-backend/infoq-core`、`infoq-scaffold-backend/infoq-modules`
- 前端：`infoq-scaffold-frontend-vue`、`infoq-scaffold-frontend-react`

## 2. 插件分档

### 2.1 框架必需插件（固定保留）

这些能力属于基座，不建议做开关化删除：

- `infoq-plugin-web`
- `infoq-plugin-security`
- `infoq-plugin-satoken`
- `infoq-plugin-mybatis`
- `infoq-plugin-redis`
- `infoq-plugin-jackson`
- `infoq-plugin-oss`（业务明确要求固定保留）

### 2.2 通用能力插件（保留为可复用能力）

这些插件保留为“通用插件库”，供系统模块与未来新业务模块直接引用：

- `infoq-plugin-translation`
- `infoq-plugin-sensitive`
- `infoq-plugin-excel`
- `infoq-plugin-log`

说明：

- 这四类插件不建议走“纯运行时开关”模式，而是走“按模块依赖接入”的通用模式。
- 当某个模块不需要时，可不声明该依赖；需要时直接在该模块 `pom.xml` 引入即可。

### 2.3 可配置插件（软关闭，随时可开）

默认关闭，通过配置即可启停：

- `infoq-plugin-encrypt`
- `infoq-plugin-mail`
- `infoq-plugin-sse`
- `infoq-plugin-websocket`
- `infoq-plugin-doc`

关键原则：

1. 依赖保留在 `infoq-system`，保证可随时启用。
2. 配置默认置为 `false`，生产按需开启。
3. 需要前后端联动的插件必须同步配置（如 encrypt/sse/websocket）。

## 3. 当前依赖基线

后端系统模块依赖入口：

- `infoq-scaffold-backend/infoq-modules/infoq-system/pom.xml`
- `infoq-scaffold-backend/infoq-core/infoq-core-data/pom.xml`

当前策略：

1. `infoq-system`：保留基座依赖 + 可配置插件依赖。
2. `infoq-core-data`：保留 `log/sensitive/translation/excel` 通用能力依赖。

## 4. 可配置插件开关矩阵

| 插件 | 后端配置键 | 前端配置键 | 默认值 | 备注 |
|---|---|---|---|---|
| encrypt | `api-decrypt.enabled` / `mybatis-encryptor.enable` | `VITE_APP_ENCRYPT` | `api-decrypt.enabled=true`，`mybatis-encryptor.enable=false` | 需要前后端同步 |
| mail | `mail.enabled` | 无 | false | 仅后端 |
| sse | `sse.enabled` | `VITE_APP_SSE` | true | 需要前后端同步 |
| websocket | `websocket.enabled` | `VITE_APP_WEBSOCKET` | false | 需要前后端同步 |
| doc | `springdoc.api-docs.enabled` | 无 | true | 仅后端 |

后端配置文件：

- `infoq-scaffold-backend/infoq-admin/src/main/resources/application.yml`
- `infoq-scaffold-backend/infoq-admin/src/main/resources/application-dev.yml`

前端配置文件：

- `infoq-scaffold-frontend-vue/.env.development`
- `infoq-scaffold-frontend-vue/.env.production`
- `infoq-scaffold-frontend-react/.env.development`
- `infoq-scaffold-frontend-react/.env.production`

## 5. 前后端具体配置方式

### 5.1 Encrypt（接口加解密）

后端：

1. 保证依赖存在：`infoq-plugin-encrypt`。
2. 开启配置：`api-decrypt.enabled=true`（如需字段加密再开 `mybatis-encryptor.enable=true`）。
3. 在需要的接口上使用 `@ApiEncrypt`（如登录、注册、改密等）。

前端：

1. 设置 `VITE_APP_ENCRYPT=true`。
2. 保持 RSA 公私钥与后端配置匹配。
3. 请求拦截和响应拦截会自动走加解密流程。

### 5.2 Mail（邮箱能力）

后端：

1. 保证依赖存在：`infoq-plugin-mail`。
2. 设置 `mail.enabled=true`。
3. 完整配置 SMTP 参数：`host/port/user/pass/from` 等。

前端：

1. 无专属开关。
2. 通过业务接口触发（如邮箱验证码接口）。

### 5.3 SSE（消息推送）

后端：

1. 保证依赖存在：`infoq-plugin-sse`。
2. 设置 `sse.enabled=true`，确认 `sse.path`。

前端：

1. 设置 `VITE_APP_SSE=true`。
2. 前端 `initSSE` 会在开关为 true 时建立连接。

### 5.4 WebSocket（消息推送）

后端：

1. 保证依赖存在：`infoq-plugin-websocket`。
2. 设置 `websocket.enabled=true`，确认 `websocket.path`。

前端：

1. 设置 `VITE_APP_WEBSOCKET=true`。
2. 前端 `initWebSocket` 会在开关为 true 时建立连接。

### 5.5 Doc（接口文档）

后端：

1. 保证依赖存在：`infoq-plugin-doc`。
2. 设置 `springdoc.api-docs.enabled=true`。

前端：

1. 无强依赖配置，通常由后端文档地址直接访问。

## 6. 通用插件接入规范（新业务模块）

### 6.1 Translation

模块接入方式：

1. 模块 `pom.xml` 引入 `infoq-plugin-translation`。
2. 在返回 VO 字段上使用 `@Translation`。
3. 如需新增翻译类型：
   - 新增实现类，实现 `TranslationInterface<T>`。
   - 使用 `@TranslationType(type = "...")` 标注。
   - 注册为 Spring Bean（`@Component` 或配置类 `@Bean`）。

### 6.2 Sensitive

模块接入方式：

1. 模块 `pom.xml` 引入 `infoq-plugin-sensitive`。
2. 在敏感字段使用 `@Sensitive`。
3. 模块可选实现 `SensitiveService`，定义本模块脱敏策略。

### 6.3 Excel

模块接入方式：

1. 模块 `pom.xml` 引入 `infoq-plugin-excel`。
2. 导入导出 VO 使用 `ExcelProperty`、`ExcelDictFormat` 等注解。
3. 控制层通过 `ExcelUtil` 执行导入导出。

### 6.4 Log

模块接入方式：

1. 模块 `pom.xml` 引入 `infoq-plugin-log`。
2. 需要记录操作日志的接口加 `@Log` + `BusinessType`。
3. 登录日志可通过事件机制记录（`LoginInfoEvent`）。

## 7. 软关闭与删除建议

### 7.1 软关闭（推荐）

流程：

1. 保留依赖不动。
2. 把对应 `enabled` 配置置为 `false`。
3. 若有前端开关，前端同步置 `false`。
4. 执行编译与冒烟验证。

适用：`encrypt/mail/sse/websocket/doc`。

### 7.2 硬删除（仅明确不再需要时）

流程：

1. 删除模块 `pom.xml` 依赖。
2. 删除直接调用代码（注解/工具类/接口）。
3. 清理配置项与前端开关。
4. 执行全量编译和登录冒烟。

## 8. 验证命令基线

后端编译：

```bash
cd infoq-scaffold-backend
mvn clean package -P dev -pl infoq-admin -am
```

后端运行（示例）：

```bash
java -jar infoq-admin/target/infoq-admin.jar \
  --server.port=18080 \
  --captcha.enable=false \
  --api-decrypt.enabled=false \
  --springdoc.api-docs.enabled=false \
  --websocket.enabled=false
```

前端编译：

```bash
cd infoq-scaffold-frontend-vue
pnpm run build:prod
```

如果当前环境没有 `pnpm`，回退为等价的 `npm run build:prod`。

## 9. 维护约定

1. 新增插件时必须先归档到本清单并声明分档（必需/通用/可配置）。
2. 任何“移除插件”改动必须同时说明是软关闭还是硬删除。
3. 影响前后端联动的插件，配置变更必须成对提交。
