---
name: infoq-browser-automation
description: Execute repo-specific browser automation for this project using Playwright MCP, local login token injection, route discovery, screenshot capture, and console diagnostics against the infoq dev stack. Use this skill only when the task is tied to this repository's local frontend/backend services and needs repo-specific runtime helpers such as token injection, exact route discovery, or post-change UI smoke verification. Prefer `agent-browser` first for generic browser interaction, and use this skill as the project-specific supplement.
compatibility: Requires the infoq local dev stack, Playwright MCP browser automation, and usually `infoq-login-success-check` plus `infoq-run-dev-stack` for token/bootstrap preparation.
---

# Infoq Browser Automation

Use this skill only for repository-local runtime verification.
Prefer `agent-browser` as the first-choice browser skill.
Use this skill only when `agent-browser` alone is not enough because the task needs repo-specific token bootstrap, route enumeration, or Playwright MCP caveats for this project.

## Workflow

1. Ensure services are running (use `infoq-run-dev-stack` skill).
2. Get login token without captcha (use `infoq-login-success-check` skill).
3. Use browser automation tool to navigate routes, collect screenshots, and inspect console errors.

## Token Preparation

Generate an expression that can be passed directly to `browser_eval` `evaluate` action:

```bash
bash .codex/skills/infoq-browser-automation/scripts/print_login_inject_snippet.sh
```

The script prints an expression like:

```text
(localStorage.setItem('Admin-Token', '...jwt...'),location.href='/index','ok')
```

## Route Discovery

List accessible router paths for navigation smoke tests:

```bash
bash .codex/skills/infoq-browser-automation/scripts/fetch_routes_with_token.sh
```

## Browser Eval Patterns

- Start browser:

```text
action=start, browser=chrome
```

- Open frontend:

```text
action=navigate, url=http://127.0.0.1:5173/login
```

- Inject token (use output from script):

```text
action=evaluate, script=(localStorage.setItem('Admin-Token','...'),location.href='/index','ok')
```

- Navigate target route:

```text
action=navigate, url=http://127.0.0.1:5173/system/role
```

- Capture screenshot:

```text
action=screenshot, fullPage=true
```

- Check console:

```text
action=console_messages, errorsOnly=true
```

## Important Notes

- In this environment, `evaluate` is wrapped as an expression. Prefer comma expressions; avoid IIFE style code.
- Route paths are case-sensitive. Use router API output instead of guessing.
- For login pages with captcha enabled, avoid manual captcha input by acquiring token through API and injecting it.

## Resources

- Injection helper: `scripts/print_login_inject_snippet.sh`
- Route helper: `scripts/fetch_routes_with_token.sh`
- Playwright MCP notes: `references/playwright-mcp-notes.md`
