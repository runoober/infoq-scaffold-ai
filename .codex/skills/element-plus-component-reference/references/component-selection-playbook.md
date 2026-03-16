# Component Selection Playbook

Use this playbook after reading `component-overview-zh-cn.md`.

## Typical Requests -> Recommended Components

1. Build a CRUD management page
- `Table` + `Pagination` + `Dialog` + `Form` + `Message` + `Popconfirm`

2. Build a settings page
- `Form` + `Input`/`Select`/`Switch` + `Card` + `Divider` (optional from Typography/Layout patterns)

3. Build a wizard/step flow
- `Steps` + `Form` + `Button`
- Use `Result` for completion state

4. Build a data dashboard
- `Card` + `Statistic` + `Progress` + `Table` or `Descriptions`
- Add `Skeleton` for loading and `Empty` for no data

5. Build side-panel editing
- `Drawer` + `Form`
- Prefer `Dialog` only when hard focus is needed

6. Build search/filter toolbar
- `Form` (inline) + `Input` + `Select` + `Date Picker`
- Add `Tag` for active filters

## Decision Heuristics

- Need strict form validation:
- Use `Form` with rules; avoid custom validation frameworks first.

- Need destructive action safety:
- Use `Popconfirm` for inline actions and `Message Box` for blocking confirms.

- Need global feedback after async calls:
- Use `Message` for short success/error and `Notification` for longer notices.

- Need rendering performance with very large lists:
- Evaluate `Virtualized Select`, `Table V2`, or `Virtualized Tree`.

## Implementation Checklist

Before coding:
- Confirm component exists in official docs.
- Confirm local `element-plus` version supports selected component.

While coding:
- Use semantic slots rather than deep DOM overrides.
- Keep custom CSS minimal and scoped.
- Keep keyboard/focus behavior intact for overlays and forms.

Before final response:
- Provide component list + key API choices.
- Mention version assumptions.
- Include concise Vue 3 example only for the requested scope.

## Version Check Command

```bash
rg '"element-plus"' package.json pnpm-lock.yaml yarn.lock package-lock.json
```

If no result appears in lock files, check the package manager in use and inspect workspace root plus app subdirectories.
