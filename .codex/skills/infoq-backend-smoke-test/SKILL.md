---
name: infoq-backend-smoke-test
description: Run repeatable backend smoke tests for this infoq project after backend changes. Use when users ask for 冒烟测试, smoke test, 接口验证, 运行态验证, or “继续执行验证”, especially after MyBatis Mapper/XML migration, permission/auth refactors, or build success confirmation.
---

# Infoq Backend Smoke Test

## Overview

Run a deterministic backend smoke test flow for `infoq-scaffold-backend`:
- Start backend server in an isolated port with captcha disabled.
- Verify public endpoints.
- Perform encrypted `/auth/login`.
- Verify protected endpoints that cover menu/dept/dict/user-export chains.
- Stop server and print a pass/fail report.

## Execute

Run:

```bash
bash .codex/skills/infoq-backend-smoke-test/scripts/run_smoke.sh
```

Common options:

```bash
# Build first, then run smoke tests
bash .codex/skills/infoq-backend-smoke-test/scripts/run_smoke.sh --build

# Use a different account or port
bash .codex/skills/infoq-backend-smoke-test/scripts/run_smoke.sh \
  --username admin \
  --password 'your-password' \
  --port 18081

# Keep server alive for manual debugging after smoke tests
bash .codex/skills/infoq-backend-smoke-test/scripts/run_smoke.sh --keep-server
```

## Defaults

- Project root: auto-detected from script location.
- Jar path: `infoq-scaffold-backend/infoq-admin/target/infoq-admin.jar`
- Port: `18080`
- Captcha: forced off via `--captcha.enable=false`
- Client ID: `e5cd7e4891bf95d1d19206ce24a7b32e`
- Preferred login candidates:
  - `dept / 666666`
  - `owner / 666666`
  - `admin / 123456`

## Success Criteria

Treat smoke test as passed only when all checks pass:
- `GET /` returns HTTP 200.
- `GET /auth/code` returns `{ code: 200 }`.
- Login succeeds and returns token.
- `GET /system/menu/getRouters` returns `{ code: 200 }`.
- `GET /system/menu/roleMenuTreeselect/{roleId}` returns `{ code: 200 }`.
- `GET /system/role/deptTree/{roleId}` returns `{ code: 200 }`.
- `GET /system/dict/data/type/{dictType}` returns `{ code: 200 }`.
- `POST /system/user/export` returns Excel binary content.

## Failure Handling

- If login fails for one account, automatically try fallback accounts.
- If server startup fails, print log tail from the generated temp log file.
- If any check fails, exit non-zero and include the failing endpoint and response preview.

## Resources

- Script entry: `scripts/run_smoke.sh`
- API check logic: `scripts/smoke_checks.mjs`
- Endpoint checklist: `references/endpoints.md`
