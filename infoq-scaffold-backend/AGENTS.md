# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|Scope:本文件适用于 `infoq-scaffold-backend` 及其子目录，用于把根规则收窄到 backend 语境。
|Stack:Spring Boot 3.5.x|JDK 17|Maven multi-module|MyBatis-Plus|Sa-Token
|Workspace Layout:infoq-admin|infoq-modules:system|infoq-plugin:*|infoq-core:{bom,common,data}
|Package And Formatting:Java package 按 `cc.infoq.{module}.{layer}` 组织。|backend `.editorconfig` 使用 4 spaces。|Java、YAML、SQL fixtures、resource files 保持 UTF-8。
|Commands:build=cd infoq-scaffold-backend && mvn clean package -P dev|run=cd infoq-scaffold-backend && mvn spring-boot:run -pl infoq-admin|test=cd infoq-scaffold-backend && mvn -pl infoq-modules/infoq-system -am -DskipTests=false test
|OpenSpec Routing:凡是影响 backend 的新功能、行为变更或跨工作区交付，编码前先创建或定位 `openspec/changes/<change-id>/`。|scope、verification、rollback notes 以 change artifacts 为准。
|Testing Boundary:优先在 `infoq-modules/infoq-system/src/test/java` 下写有针对性的 JUnit 5 测试。|默认使用 `@Tag("dev")` 匹配 Surefire groups。|Mapper default methods 可用 unit tests；纯 SQL 或 XML mapper methods 归入 mapper XML integration tests。
|Verification:backend 行为变更先验证 main flow，再跑目标 `mvn` tests，再做相关 package/build verification。|mapper、XML、auth 或影响 runtime 的改动后运行 infoq-backend-smoke-test。|`/auth/login` 或 token verification 改动使用 infoq-login-success-check。
|Skill Routing:backend 测试设计和补测使用 infoq-backend-unit-test-patterns。|smoke 或 API verification 使用 infoq-backend-smoke-test。|登录验证与失败诊断使用 infoq-login-success-check。
|Boundaries:本工作区不要套用前端的 pnpm、lint 或 build 规则。|交付时明确说明 config、SQL、dependency、observability 和 rollback impact。
