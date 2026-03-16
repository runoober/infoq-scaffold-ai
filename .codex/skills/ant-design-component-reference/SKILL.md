---
name: ant-design-component-reference
description: Reference Ant Design official docs to select components and implement React UIs with correct API usage and version checks. Use when requests mention Ant Design/antd components, building or refactoring React pages with forms/tables/dialogs, converting designs into Ant Design implementations, or verifying whether a component/feature is supported by the current antd version (including Chinese prompts like “用 Ant Design 实现页面”, “查组件 API”, “这个组件哪个版本支持”).
---

# Ant Design Component Reference

## Overview

Use Ant Design official documentation as the source of truth for component selection and API usage.
Start with `references/component-overview-zh-cn.md`, then confirm component-level APIs before coding.

## Workflow

1. Classify the UI requirement.
- Map requests to one or more categories: `通用`, `布局`, `导航`, `数据录入`, `数据展示`, `反馈`, `其他`, `重型组件`.

2. Pick candidate components from official overview.
- Read `references/component-overview-zh-cn.md`.
- Shortlist 1-3 components that best match the task.

3. Verify APIs on official component pages before coding.
- Confirm key `props`, `events`, `slots/render props`, `methods`.
- If unsure about route path, navigate from the overview index instead of guessing URLs.

4. Check local antd version compatibility.
- Run:

```bash
rg '"antd"|@ant-design' package.json pnpm-lock.yaml yarn.lock package-lock.json
```

- For components/features with minimum-version tags, ensure local version satisfies requirements.

5. Implement React code with minimal custom CSS overrides.
- Keep Ant Design interaction semantics and accessibility defaults.
- Prefer official composition patterns over custom behavior rewrites.

6. Validate behavior.
- Check loading/empty/error states.
- Check form validation and disabled states.
- Check destructive actions use confirmation patterns.

## Fast Decision Rules

- Forms:
- Start with `Form` + `Form.Item`, then add `Input`, `Select`, `DatePicker`, `Radio`, `Checkbox`, `Upload` as needed.

- CRUD tables:
- Prefer `Table` + `Pagination`; use `Modal`/`Drawer` for edit flows.
- Avoid `List` for new pages because it is marked deprecated in current overview docs.

- Feedback:
- Use `message` for transient feedback, `notification` for richer notices, `Modal.confirm`/`Popconfirm` for risky actions.

- Overlays:
- Use `Modal` for focused blocking tasks, `Drawer` for side-panel workflows.

- Global app wrappers:
- Use `App` + `ConfigProvider` in entry layout when relying on theme/locale/message context behavior.

## Output Contract

When returning implementation guidance or code:
- List chosen components.
- List key APIs used (`props/events/methods`) in concise form.
- State version assumptions and constraints explicitly.
- Provide concise React examples only for requested scope.

## Resources

- `references/component-overview-zh-cn.md`: Official overview index snapshot from ant.design.
- `references/component-selection-playbook.md`: Scenario-based component choices and version-check checklist.
