# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|Scope:本文件适用于 `infoq-scaffold-backend` 及其子目录，用于把根规则收窄到 backend 语境。
|Stack:Spring Boot 3.5.x|JDK 17|Maven multi-module|MyBatis-Plus|Sa-Token
|Workspace Layout:infoq-admin|infoq-modules/infoq-system|infoq-plugin:*|infoq-core:{infoq-core-bom,infoq-core-common,infoq-core-data}
|Package And Formatting:Java package 按 `cc.infoq.{module}.{layer}` 组织。|backend `.editorconfig` 使用 4 spaces。|Java、YAML、SQL fixtures、resource files 保持 UTF-8。
|Redisson OSS Policy:backend 仅允许使用 Redisson 开源版兼容 API。|禁止调用 `getLocalCachedMapCache`、依赖 `keepAliveTime` 的 `RRateLimiter` 重载等 PRO-only 能力。|涉及缓存、限流、Sa-Token 或登录链路的修复必须补 OSS 兼容测试与运行态校验。
|Commands:build=cd infoq-scaffold-backend && mvn clean package -P dev|run=cd infoq-scaffold-backend && mvn spring-boot:run -pl infoq-admin|test=cd infoq-scaffold-backend && mvn -pl infoq-modules/infoq-system -am -DskipTests=false test|test:all=cd infoq-scaffold-backend && mvn -DskipTests=false test
|Runtime Secrets:运行或部署保持现有仓库默认密码。
|OpenSpec Routing:分级执行。|L3(强制):backend 新功能、API 契约变更、跨工作区交付，编码前先创建或定位 `openspec/changes/<change-id>/`。|L2(Lite):单 backend 行为变更且不改 API 契约，至少维护 `proposal.md`+`tasks.md`。|L1(可豁免):单 backend 小修复且不改契约、改动范围小可不建 OpenSpec，但必须先写 acceptance contract。|不确定分级时默认 L3。|OpenSpec 文档正文默认中文，路径名称/命令/文件名保持英文原样。|scope、verification、rollback notes 以 change artifacts 或 acceptance contract 为准。
|Testing Boundary:优先在 `infoq-modules/infoq-system/src/test/java`、`infoq-plugin/**/src/test/java`、`infoq-core/**/src/test/java` 下写有针对性的 JUnit 5 测试。|默认使用 `@Tag("dev")` 匹配 Surefire groups。|Mapper default methods 可用 unit tests；纯 SQL 或 XML mapper methods 归入 mapper XML integration tests。
|Verification:backend 行为变更先验证 main flow，再跑目标 `mvn` tests，再做相关 package/build verification。|auth/login/token 相关改动先跑 infoq-login-success-check，再跑 infoq-backend-smoke-test。|mapper、XML、permission、runtime wiring 改动后运行 infoq-backend-smoke-test。
|Skill Routing:backend 测试设计和补测使用 infoq-backend-unit-test-patterns。|smoke 或 API verification 使用 infoq-backend-smoke-test。|登录验证与失败诊断使用 infoq-login-success-check。
|Boundaries:本工作区不要套用前端的 pnpm、lint、AppID 或 DevTools 规则。|交付时明确说明 config、SQL、dependency、observability 和 rollback impact。
