---
name: infoq-weapp-react-smoke-test
description: Run deterministic smoke tests for infoq-scaffold-frontend-weapp-react mini-program runtime, including full route checks and API contract coverage. Use when users ask for 小程序冒烟测试, weapp e2e, 接口覆盖验证, 全量路由验证, or React 小程序联调回归. This skill defaults to full suite and auto-login with captcha-safe guidance.
---

# Infoq Weapp React Smoke Test

## Overview

Run a repeatable weapp smoke flow for `infoq-scaffold-frontend-weapp-react`:
- Build mini-program dist (development mode by default).
- Force `WECHAT_DEVTOOLS_URL_CHECK=false` by default (不校验合法域名...).
- Run `tests/e2e/weapp/runner.mjs` with suite selection.
- Default suite is `full` to cover API wrapper contracts and all registered routes.

## Execute

Run:

```bash
bash .agents/skills/infoq-weapp-react-smoke-test/scripts/run_smoke.sh
```

Recommended pre-step for local verification:

```bash
cd infoq-scaffold-backend
mvn -pl infoq-admin -am -DskipTests clean package
java -jar infoq-admin/target/infoq-admin.jar \
  --spring.profiles.active=local \
  --captcha.enable=false \
  --server.port=8080
```

Common variants:

```bash
# Core suite only
bash .agents/skills/infoq-weapp-react-smoke-test/scripts/run_smoke.sh --suite core

# Reuse existing logged-in session (manual login once, then no captcha step in smoke)
bash .agents/skills/infoq-weapp-react-smoke-test/scripts/run_smoke.sh --keep-existing-session

# Disable auto-login and run unauthenticated guard assertions
bash .agents/skills/infoq-weapp-react-smoke-test/scripts/run_smoke.sh --no-auto-login

# Override backend base URL or preferred login account
bash .agents/skills/infoq-weapp-react-smoke-test/scripts/run_smoke.sh \
  --base-url http://127.0.0.1:8080 \
  --username admin \
  --password admin123

# Login success -> home only (for manual smoke goal)
bash .agents/skills/infoq-weapp-react-smoke-test/scripts/run_smoke.sh \
  --suite smoke \
  --skip-build \
  --base-url http://127.0.0.1:8080 \
  --login-home-only
```

## Defaults

- Workspace: `infoq-scaffold-frontend-weapp-react`
- Suite: `full`
- Build before smoke: enabled (`build:weapp:dev`)
- URL legal-domain check: disabled (`WECHAT_DEVTOOLS_URL_CHECK=false`)
- Auto-login: enabled (`WEAPP_E2E_AUTO_LOGIN=true`)
- Console error guard: enabled (`WEAPP_E2E_FAIL_ON_CONSOLE_ERROR=true`)

## Success Criteria

Smoke passes only when all of the following are true:
- Runner exits with code `0`.
- `full` suite has no failed and no skipped cases.
- API contract suite covers all `src/api/**/*.ts` exports.
- Route/auth/profile/notice/permission suites pass.
- No runtime console `error` or app exception (default strict mode).

## Failure Handling

- If WeChat DevTools CLI is unavailable, runner fails explicitly.
- If dist config is missing, runner fails explicitly.
- If auto-login sees `captchaEnabled=true`, runner fails explicitly and asks for backend temporary override `--captcha.enable=false`.
- If token/session is invalid and protected route assertions fail, runner exits non-zero with case-level failure details.

## Login-Home Verification Mode

Use `--login-home-only` when the goal is only “登录成功并进入主页”.

Behavior:
- Forces `suite=smoke`.
- Performs backend `/auth/code` health probe before runner starts.
- Requires route `/pages/home/index` to pass and authenticated token injection to be present.
- Tolerates the known mismatch where authenticated `/pages/login/index` is redirected to `/pages/home/index` by app guard.

Known mismatch rationale:
- Current smoke suite still contains `route:/pages/login/index` and expects login route in authenticated flow.
- Actual app behavior redirects authenticated login route to home.
- This mode keeps default strict smoke behavior unchanged and only applies explicit login-home goal criteria.

## Resources

- Script entry: `scripts/run_smoke.sh`
- Endpoint and suite checklist: `references/endpoints.md`
- Mode and command matrix: `references/commands.md`
