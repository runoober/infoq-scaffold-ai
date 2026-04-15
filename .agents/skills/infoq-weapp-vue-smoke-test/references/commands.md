# Commands

## Backend Pre-Step (Recommended)

```bash
cd infoq-scaffold-backend
mvn -pl infoq-admin -am -DskipTests clean package
java -jar infoq-admin/target/infoq-admin.jar \
  --spring.profiles.active=local \
  --captcha.enable=false \
  --server.port=8080
```

## Default Full Smoke

```bash
bash .agents/skills/infoq-weapp-vue-smoke-test/scripts/run_smoke.sh
```

## Core Smoke

```bash
bash .agents/skills/infoq-weapp-vue-smoke-test/scripts/run_smoke.sh --suite core
```

## Reuse Existing Session (Manual Login Once)

```bash
bash .agents/skills/infoq-weapp-vue-smoke-test/scripts/run_smoke.sh --keep-existing-session
```

## Keep Legal-Domain Check Enabled

```bash
bash .agents/skills/infoq-weapp-vue-smoke-test/scripts/run_smoke.sh --url-check
```

## Explicit Backend Login Target

```bash
bash .agents/skills/infoq-weapp-vue-smoke-test/scripts/run_smoke.sh \
  --base-url http://127.0.0.1:8080 \
  --username admin \
  --password admin123
```

## Troubleshooting (Project Proven)

```bash
# Symptom: miniprogram-automator throws `cmpVersion ... split of undefined`
# Cause: newer DevTools Tool.getInfo may not return SDKVersion field name
# Fix: ensure workspace patch is applied
cd infoq-scaffold-frontend-weapp-vue
pnpm install
```

```bash
# Symptom: permission.flow fails at form/detail route without token
# Fix: verify page-level route entry guard exists (onLoad/onShow -> ensureAuthenticated)
cd infoq-scaffold-frontend-weapp-vue
rg -n "onLoad\\(|onShow\\(|ensureAuthenticated" src/pages
```

```bash
# Symptom: full.routes fails on notice-detail route mismatch
# Cause: notice-detail intentionally falls back to notice list when noticeId is missing
# Fix: keep full.routes assertion allowing /pages/notices/index fallback
cd infoq-scaffold-frontend-weapp-vue
pnpm run test:e2e:weapp:full
```
