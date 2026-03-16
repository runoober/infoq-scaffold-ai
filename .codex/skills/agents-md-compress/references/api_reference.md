# AGENTS.md Templates & Examples

## 1) Minimal Universal Template

```markdown
# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks.
|Project Root:./
|Source:src:{api,components,utils}
|Config:./:{package.json,tsconfig.json}
|Build:npm run build|npm run dev
|Test:npm test
|Lint:npm run lint
|PR Checklist:scope|verification|linked issue
```

## 2) Spring Boot + Frontend Template

```markdown
# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks.
|Project Root:./
|Workspaces:backend:{core,plugin,modules}|frontend:{src,public}
|Backend Config:backend/module/src/main/resources:{application.yml,application-dev.yml,application-prod.yml}
|Database:sql:{schema.sql}
|Architecture:Controller→Service→Mapper→Entity
|Build Commands:mvn clean package -P dev|mvn spring-boot:run -pl modules/system
|Frontend Commands:npm install|npm run dev|npm run build:prod
|Commit Convention:feat|fix|refactor|docs
|PR Checklist:changed modules|verification commands|config/sql impact
```

## 3) High-Signal Compression Pattern

- 先写“必须规则”，后写“结构索引”，再写“命令与门禁”。
- 一行一个主题，避免复合语义。
- 仅保留“能指导执行”的信息，删除解释性背景。
