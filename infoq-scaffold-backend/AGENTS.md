# AGENTS.md
|IMPORTANT:This file applies to infoq-scaffold-backend and its descendants; use it to narrow broad root guidance with backend-specific rules.
|Stack:Spring Boot 3.5.x|JDK 17|Maven multi-module|MyBatis-Plus|Sa-Token
|Workspace Layout:infoq-admin|infoq-modules:system|infoq-plugin:*|infoq-core:{bom,common,data}
|Package And Formatting:Java packages follow cc.infoq.{module}.{layer}.|Backend .editorconfig uses 4 spaces.|Keep Java, YAML, SQL fixtures, and resource files UTF-8.
|Commands:build=cd infoq-scaffold-backend && mvn clean package -P dev|run=cd infoq-scaffold-backend && mvn spring-boot:run -pl infoq-admin|test=cd infoq-scaffold-backend && mvn -pl infoq-modules/infoq-system -am -DskipTests=false test
|OpenSpec Routing:For any new feature, behavior change, or cross-workspace delivery touching backend code, create or locate `openspec/changes/<change-id>/` before editing code.|Use the change artifacts as the source of truth for scope, verification, and rollback notes.
|Testing Boundary:Prefer targeted JUnit 5 tests under infoq-modules/infoq-system/src/test/java.|Use @Tag("dev") by default to match Surefire groups.|Mapper default methods may use unit tests; pure SQL or XML mapper methods belong in mapper XML integration tests.
|Verification:For backend behavior changes validate main flow first, then targeted mvn tests, then relevant package/build verification.|Run infoq-backend-smoke-test after mapper, XML, auth, or runtime-affecting backend changes.|Use infoq-login-success-check for /auth/login or token verification changes.
|Skill Routing:Use infoq-backend-unit-test-patterns for backend test design and backfill.|Use infoq-backend-smoke-test for smoke or API verification.|Use infoq-login-success-check for login verification and failure diagnosis.
|Boundaries:Do not apply frontend pnpm, lint, or build rules in this workspace.|Call out config, SQL, dependency, observability, and rollback impact in handoff.
