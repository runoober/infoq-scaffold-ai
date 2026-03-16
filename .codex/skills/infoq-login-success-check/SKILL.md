---
name: infoq-login-success-check
description: Verify backend login success deterministically for this project, including encrypted/plain /auth/login fallback, token validation, and protected endpoint checks. Use when users ask for 登录成功验证, 登录接口验证, auth/login 检查, 登录冒烟, 登录失败排查, or confirm backend can log in.
---

# Infoq Login Success Check

## Execute

Run login verification against local backend:

```bash
bash .codex/skills/infoq-login-success-check/scripts/verify_login.sh
```

Common variants:

```bash
# Build backend jar first if needed
bash .codex/skills/infoq-login-success-check/scripts/verify_login.sh --build

# Force auto temp backend (captcha disabled) on another port
bash .codex/skills/infoq-login-success-check/scripts/verify_login.sh --temp-port 18081

# Specify account
bash .codex/skills/infoq-login-success-check/scripts/verify_login.sh \
  --username admin \
  --password admin123

# Print token for browser automation
bash .codex/skills/infoq-login-success-check/scripts/verify_login.sh --print-token
```

## Behavior

- Prefer checking existing backend at `http://127.0.0.1:8080`.
- If backend is unreachable, or `captchaEnabled=true`, auto-start temp backend with `--captcha.enable=false` (default port `18081`).
- Attempt `/auth/login` in encrypted mode first, then plain mode fallback.
- Confirm token validity with:
  - `GET /system/user/getInfo`
  - `GET /system/menu/getRouters`

## Defaults

- Client ID: `e5cd7e4891bf95d1d19206ce24a7b32e`
- Login candidates:
  - `admin / admin123`
  - `dept / 666666`
  - `owner / 666666`
  - `admin / 123456`

## Resources

- Entrypoint: `scripts/verify_login.sh`
- API logic: `scripts/login_check.mjs`
- Endpoint notes: `references/endpoints.md`
