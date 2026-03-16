---
name: element-plus-component-reference
description: Reference Element Plus official docs to select components and implement Vue 3 UIs with correct API usage and version checks. Use when requests mention Element Plus/El* components, building or refactoring Vue pages with forms/tables/dialogs, converting designs to Element Plus, or verifying whether a component/feature is supported by the current Element Plus version (including Chinese prompts like “用 Element Plus 实现页面”, “查组件 API”, “这个组件哪个版本支持”).
---

# Element Plus Component Reference

## Overview

Use Element Plus official documentation as the source of truth for component selection and API usage.
Start with the overview index in `references/component-overview-zh-cn.md`, then confirm component-level APIs before coding.

## Workflow

1. Classify the UI requirement.
- Map requests to one or more categories: `Basic`, `Form`, `Data`, `Navigation`, `Feedback`, `Others`.

2. Pick candidate components from the official overview index.
- Read `references/component-overview-zh-cn.md`.
- Shortlist 1-3 components that best fit the task.

3. Verify APIs on official component pages before writing code.
- Confirm key `props`, `events`, `slots`, and `exposes`.
- If unsure about URL slug, navigate from overview links instead of guessing.

4. Check local Element Plus version compatibility.
- Run:

```bash
rg '"element-plus"' package.json pnpm-lock.yaml yarn.lock package-lock.json
```

- For components/features with minimum-version tags, ensure local version satisfies requirements.

5. Implement Vue 3 code with `script setup` and minimal custom CSS.
- Preserve Element Plus semantics and default interaction patterns.
- Avoid replacing built-in behavior with custom JavaScript unless required.

6. Validate behavior.
- Check loading/empty/error states.
- Check form validation and disabled states.
- Check destructive actions use confirmation patterns.

## Fast Decision Rules

- Forms:
- Start with `Form` + `Form Item`, then add `Input`, `Select`, `Radio`, `Checkbox`, `Date Picker`, `Upload` as needed.

- Data lists:
- Prefer `Table` + `Pagination`; add `Skeleton` for loading and `Empty` for no-data states.

- Feedback:
- Use `Message` for transient feedback, `Notification` for longer notices, `Message Box`/`Popconfirm` for risky actions.

- Overlays:
- Use `Dialog` for focused modal tasks, `Drawer` for side-panel workflows.

- Large option sets:
- Prefer `Virtualized Select`, `Virtualized Table`, or `Virtualized Tree`.

## Output Contract

When returning implementation guidance or code:
- List chosen components.
- List the key APIs used (`props/events/slots`) in concise form.
- State version assumptions and constraints explicitly.
- Provide a concise Vue 3 code sample when code is requested.

## Resources

- `references/component-overview-zh-cn.md`: Official overview index and component catalog snapshot.
- `references/component-selection-playbook.md`: Scenario-based component choices and version-check checklist.
