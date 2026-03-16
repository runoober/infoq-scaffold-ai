---
name: agent-browser
description: Browser automation CLI for AI agents. Use this skill whenever the user needs website interaction or browser-state verification, including opening pages, filling forms, clicking buttons, logging in, taking screenshots, scraping rendered content, checking console errors, or testing web-app flows, even if they do not explicitly ask for "browser automation."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
compatibility: Requires `agent-browser` CLI and a local Playwright-compatible browser runtime. If a custom browser binary or persisted session is needed, use the documented flags instead of ad-hoc shell workarounds.
---

# Browser Automation with agent-browser

Use `agent-browser` as the default CLI workflow for real browser interaction in this repository.
Keep the main skill light: do the common workflow here, then load the matching reference file only when the task needs deeper detail.

## Fast Path

Most tasks should follow this sequence:

1. Open the target page.
2. Wait for load or a stable element.
3. Snapshot interactive elements.
4. Interact using `@e` refs or semantic locators.
5. Re-snapshot after navigation or DOM changes.
6. Capture output: text, screenshot, PDF, console, or errors.

Baseline pattern:

```bash
agent-browser open https://example.com
agent-browser wait --load networkidle
agent-browser snapshot -i
```

Then act on the returned refs:

```bash
agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i
```

## Core Rules

- Re-snapshot after any navigation, modal open, DOM refresh, or major client-side render.
- Prefer `snapshot -i` for normal workflows. Use `snapshot -i -C` when clickable containers are missing from the ref list.
- Prefer semantic locators such as `find role`, `find text`, `find label`, or `find placeholder` when refs are unstable.
- Prefer `wait --load networkidle`, `wait --url`, or `wait <selector>` over blind sleeps. Use fixed millisecond waits only when no deterministic signal exists.
- Prefer saved auth state or `auth` commands over exposing raw passwords in shell history.
- When changing runtime options such as `--executable-path`, `--session-name`, or headed/headless mode, close the browser first and restart with the new flags.

## Common Patterns

Open and inspect:

```bash
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser snapshot -i
```

Submit a form:

```bash
agent-browser fill @e1 "Jane Doe"
agent-browser fill @e2 "jane@example.com"
agent-browser click @e3
agent-browser wait --load networkidle
```

Extract rendered content:

```bash
agent-browser get text body > page.txt
agent-browser get html body > page.html
```

Capture visual state:

```bash
agent-browser screenshot
agent-browser screenshot --full
agent-browser screenshot --annotate
```

Inspect runtime failures:

```bash
agent-browser console
agent-browser errors
```

## Reference Loading Guide

Load only the file needed for the current task.

- Full command surface and flags:
  `references/commands.md`
- Ref lifecycle, interactive snapshots, and locator stability:
  `references/snapshot-refs.md`
- Login flows, auth vault, state save/load, and credential handling:
  `references/authentication.md`
- Sessions, cookies, storage, cleanup, and persistence:
  `references/session-management.md`
- Trace, profiler, console, errors, and visual debugging:
  `references/profiling.md`
- Proxy, custom browser binary, SSL, and network environment setup:
  `references/proxy-support.md`
- Video recording workflows:
  `references/video-recording.md`

## Templates

Use the matching template before improvising a long shell sequence:

- Authenticated session bootstrap:
  `templates/authenticated-session.sh`
- Page capture workflow:
  `templates/capture-workflow.sh`
- Form automation workflow:
  `templates/form-automation.sh`

## Task Selection

Use this skill for:

- Opening a site and clicking through it.
- Filling or submitting a web form.
- Logging in to a web app.
- Taking screenshots or PDFs of rendered pages.
- Scraping text from rendered DOM, not just raw HTML.
- Validating client-side flows, route transitions, or interactive UI.
- Collecting browser console errors, runtime exceptions, or traces.

Do not use this skill when plain HTTP is enough and browser rendering adds no value.

## Guardrails

- Treat `eval` as a last-mile tool for inspection or state injection, not the default interaction method.
- If shell escaping becomes fragile, switch to `eval --stdin` or the dedicated template/reference flow instead of forcing nested quoting.
- Use `--headed`, annotated screenshots, traces, or profiler output when a task is visually or timing sensitive.
- Close the browser when the task ends if you changed session settings or launched a special runtime.

## Minimal Escalation Path

If the default flow is not enough:

1. Read the relevant reference file.
2. Retry with a more stable locator or wait condition.
3. Add screenshot, console, errors, or trace output.
4. Switch to persisted auth/session or a custom browser/runtime flag if the environment requires it.

That escalation path keeps the main workflow predictable and avoids bloating the skill body.
