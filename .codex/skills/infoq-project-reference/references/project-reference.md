# InfoQ Project Reference

## Project Scope

- Project root: `./`
- Workspaces:
  - `infoq-scaffold-backend`: `infoq-core`, `infoq-plugin`, `infoq-modules`, `infoq-admin`
  - `infoq-scaffold-frontend-react`: `src`, `public`, `tests`
  - `infoq-scaffold-frontend-vue`: `src`, `public`, `html`, `tests`, `vite`
  - `script`: `bin`, `docker`
  - `sql`: `infoq_scaffold_2.0.0.sql`

## Backend Reference

- Backend modules:
  - `infoq-core`: `infoq-core-bom`, `infoq-core-common`, `infoq-core-data`
  - `infoq-plugin`: `encrypt`, `excel`, `jackson`, `log`, `mail`, `mybatis`, `oss`, `redis`, `satoken`, `security`, `sensitive`, `sse`, `tenant`, `translation`, `web`, `websocket`, `doc`
  - `infoq-modules`: `system`
  - `infoq-admin`: `boot`, `api`
- Backend entry: `infoq-scaffold-backend/infoq-admin/src/main/java/cc/infoq/admin/SysAdminApplication.java`
- Backend artifact: `infoq-scaffold-backend/infoq-admin/target/infoq-admin.jar`
- Backend config files:
  - `infoq-scaffold-backend/infoq-admin/src/main/resources/application.yml`
  - `infoq-scaffold-backend/infoq-admin/src/main/resources/application-dev.yml`
  - `infoq-scaffold-backend/infoq-admin/src/main/resources/application-prod.yml`
  - `infoq-scaffold-backend/infoq-admin/src/main/resources/logback-plus.xml`
  - `infoq-scaffold-backend/infoq-admin/src/main/resources/banner.txt`

## Frontend Reference

- Vue source directories:
  - `infoq-scaffold-frontend-vue/src/api`
  - `infoq-scaffold-frontend-vue/src/views`
  - `infoq-scaffold-frontend-vue/src/components`
  - `infoq-scaffold-frontend-vue/src/store`
  - `infoq-scaffold-frontend-vue/src/router`
  - `infoq-scaffold-frontend-vue/src/utils`
  - `infoq-scaffold-frontend-vue/src/assets`
  - `infoq-scaffold-frontend-vue/src/types`
  - `infoq-scaffold-frontend-vue/src/plugins`
  - `infoq-scaffold-frontend-vue/src/hooks`
  - `infoq-scaffold-frontend-vue/src/lang`
- Vue config files:
  - `infoq-scaffold-frontend-vue/package.json`
  - `infoq-scaffold-frontend-vue/vite.config.ts`
  - `infoq-scaffold-frontend-vue/eslint.config.ts`
  - `infoq-scaffold-frontend-vue/.prettierrc`
  - `infoq-scaffold-frontend-vue/.editorconfig`
  - `infoq-scaffold-frontend-vue/.env.development`
  - `infoq-scaffold-frontend-vue/.env.production`
  - `infoq-scaffold-frontend-vue/tsconfig.json`

## Infrastructure Reference

- Infrastructure files:
  - `script/docker/docker-compose.yml`
  - `script/docker/nginx/conf/nginx.conf`
  - `script/docker/redis/conf/redis.conf`
  - `script/docker/redis/data/README.md`
  - `script/bin/infoq.sh`
  - `script/bin/deploy-frontend.sh`
- Database file: `sql/infoq_scaffold_2.0.0.sql`

## Conventions

- Architecture: `Controller -> Service -> Mapper -> Entity`
- Package convention: `cc.infoq.{module}.{layer}` where `layer` is `controller`, `service`, `mapper`, or `domain`
- Naming:
  - Java entities and mappers use `Sys*`
  - Vue components use PascalCase
  - TypeScript utils and hooks use camelCase
- Formatting:
  - All project files must use UTF-8 encoding
  - Backend `.editorconfig` uses 4 spaces
  - Frontend `.editorconfig` uses 2 spaces
  - Frontend formatting uses eslint + prettier

## Tech Stack

- Backend: Spring Boot `3.5.10`, JDK `17`, MyBatis-Plus `3.5.16`, Sa-Token `1.44.0`, Redisson `3.52.0`
- Frontend: Vue `3`, TypeScript, Vite `6`, Element Plus

## Commands

- Frontend package manager policy: prefer `pnpm`; if `pnpm` is unavailable, fall back to equivalent `npm` commands
- Fallback mapping: `pnpm install -> npm install`, `pnpm run <script> -> npm run <script>`

- Backend build: `cd infoq-scaffold-backend && mvn clean package -P dev`
- Backend run: `cd infoq-scaffold-backend && mvn spring-boot:run -pl infoq-admin`
- Backend test: `cd infoq-scaffold-backend && mvn test -pl infoq-modules/infoq-system -DskipTests=false`
- Frontend install: `cd infoq-scaffold-frontend-vue && pnpm install`
- Frontend dev: `cd infoq-scaffold-frontend-vue && pnpm run dev`
- Frontend production build: `cd infoq-scaffold-frontend-vue && pnpm run build:prod`
- Frontend lint fix: `cd infoq-scaffold-frontend-vue && pnpm run lint:eslint:fix`
- Frontend prettier: `cd infoq-scaffold-frontend-vue && pnpm run prettier`
- Deploy backend: `bash script/bin/infoq.sh deploy`
- Deploy frontend: `bash script/bin/deploy-frontend.sh deploy`

## Validation And Delivery

- Backend tests use JUnit 5 under `infoq-modules/infoq-system/src/test/java/test`
- Surefire uses `groups=${profiles.active}` and `excludedGroups=exclude`
- Backend tests use `@Tag(local|dev|prod)`
- Frontend has no dedicated test runner; minimum validation is `pnpm run lint:eslint:fix` plus `pnpm run build:prod`, or the equivalent `npm` commands when `pnpm` is unavailable
- Commit convention: `feat`, `update`, `modify`
- Branch convention: `feature/*`, for example `feature/upgrade_5.5.3`
- PR checklist:
  - Changed modules
  - Config or SQL impact
  - Verification commands
  - UI screenshots for frontend changes
  - Linked issue or task
