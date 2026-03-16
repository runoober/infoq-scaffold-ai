---
name: infoq-run-dev-stack
description: Start, restart, and stop this repository's local backend and frontend dev services with health checks and logs. Supports Vue, React, or both frontends for local联调. Use when users ask to 启动后端, 启动前端, 启动项目, run dev, 本地联调, 前后端一起跑起来, restart services, or stop local services.
---

# Infoq Run Dev Stack

## Execute

Start backend + Vue frontend:

```bash
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh
```

Common variants:

```bash
# Build backend jar first, then start
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh --build-backend

# Start backend only
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh --backend-only

# Start Vue frontend only
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh --frontend-only --frontend vue

# Start React frontend only
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh --frontend-only --frontend react --react-port 5174

# Start both frontends in parallel
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh --frontend-only --frontend both

# Custom ports
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh \
  --backend-port 8080 \
  --frontend both \
  --vue-port 5173 \
  --react-port 5174
```

Stop services started by this skill:

```bash
bash .codex/skills/infoq-run-dev-stack/scripts/stop_dev_stack.sh
```

## Defaults

- Backend project: `infoq-scaffold-backend`
- Backend jar: `infoq-scaffold-backend/infoq-admin/target/infoq-admin.jar`
- Backend port: `8080`
- Spring profile: `dev`
- Frontend target: `vue`
- Vue frontend project: `infoq-scaffold-frontend-vue`
- React frontend project: `infoq-scaffold-frontend-react`
- Frontend dev host: `127.0.0.1`
- Vue dev port: `5173`
- React dev port: `5174`
- Package manager: prefer `pnpm` for faster dependency install and frontend startup; fallback to `npm` only when `pnpm` is unavailable

## Behavior

- Reuse existing process if target port is already listening.
- Start missing service in background and wait for HTTP health.
- `--frontend both` will start Vue and React together on separate ports.
- Persist runtime state at `/tmp/infoq-dev-stack.state`.
- Print backend/Vue/React log file paths for quick troubleshooting.

## Troubleshooting

Read:

- `references/troubleshooting.md`
