---
name: infoq-login-success-check
description: 对本项目后端执行可确定的登录成功校验，覆盖加密/明文 `/auth/login` 回退、token 校验与受保护接口检查。适用于登录成功验证、登录接口验证、auth/login 排查、登录冒烟与登录失败诊断场景。
---

# Infoq 登录成功校验

## 执行

对本地后端执行登录校验：

```bash
bash .agents/skills/infoq-login-success-check/scripts/verify_login.sh
```

常用变体：

```bash
# Build backend jar first if needed
bash .agents/skills/infoq-login-success-check/scripts/verify_login.sh --build

# Force auto temp backend (captcha disabled) on another port
bash .agents/skills/infoq-login-success-check/scripts/verify_login.sh --temp-port 18081

# Specify account
bash .agents/skills/infoq-login-success-check/scripts/verify_login.sh \
  --username admin \
  --password admin123

# Print token for browser automation
bash .agents/skills/infoq-login-success-check/scripts/verify_login.sh --print-token
```

## 行为说明

- 优先检查 `http://127.0.0.1:8080` 的现有后端。
- 若后端不可达，或 `captchaEnabled=true`，自动以 `local` profile + `--captcha.enable=false` 启动临时后端（默认端口 `18081`）。
- 先尝试加密模式 `/auth/login`，失败后回退明文模式。
- 通过以下接口确认 token 有效性：
  - `GET /system/user/getInfo`
  - `GET /system/menu/getRouters`
- 本仓库默认基线是 Redisson OSS。若加密登录返回 `This feature is implemented in the Redisson PRO version`，应视为业务代码违规使用 PRO-only API，而不是环境噪声。

## 默认值

- Spring profile：`local`
- Client ID：`e5cd7e4891bf95d1d19206ce24a7b32e`
- 登录候选账号：
  - `admin / admin123`
  - `dept / 666666`
  - `owner / 666666`
  - `admin / 123456`

## 参考资源

- 入口脚本：`scripts/verify_login.sh`
- API 逻辑：`scripts/login_check.mjs`
- 接口说明：`references/endpoints.md`
