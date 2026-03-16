# Troubleshooting

## Backend fails to start

1. Check whether port is occupied:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

2. Read backend log:

```bash
tail -n 200 /tmp/infoq-dev-stack/backend-8080.log
```

3. Rebuild and restart:

```bash
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh --build-backend --force-restart
```

## Frontend fails to start

Frontend commands below prefer `pnpm`. If `pnpm` is not installed in the current environment, switch to the equivalent `npm` command.

1. Check frontend log:

```bash
tail -n 200 /tmp/infoq-dev-stack/frontend-vue-5173.log
```

2. Install dependencies then restart:

```bash
cd infoq-scaffold-frontend-vue && pnpm install
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh --frontend-only --frontend vue --force-restart
```

3. If React frontend fails instead:

```bash
tail -n 200 /tmp/infoq-dev-stack/frontend-react-5174.log
cd infoq-scaffold-frontend-react && pnpm install
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh --frontend-only --frontend react --force-restart
```

## Stop and cleanly restart

```bash
bash .codex/skills/infoq-run-dev-stack/scripts/stop_dev_stack.sh
bash .codex/skills/infoq-run-dev-stack/scripts/start_dev_stack.sh
```
