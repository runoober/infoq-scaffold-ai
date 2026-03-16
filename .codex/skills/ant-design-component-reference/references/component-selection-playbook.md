# Component Selection Playbook

Use this playbook after reading `component-overview-zh-cn.md`.

## Typical Requests -> Recommended Components

1. Build a CRUD admin page
- `Table` + `Pagination` + `Form` + `Modal`/`Drawer` + `message` + `Popconfirm`

2. Build a settings/preferences page
- `Form` + `Input`/`Select`/`Switch` + `Card` + `Divider`

3. Build a wizard/step flow
- `Steps` + `Form` + `Button`
- Use `Result` for completion state

4. Build a data dashboard
- `Card` + `Statistic` + `Progress` + `Table` or `Descriptions`
- Add `Skeleton` for loading and `Empty` for no data

5. Build side-panel editing
- `Drawer` + `Form`
- Use `Modal` only when strict blocking focus is required

6. Build search/filter toolbar
- `Form` (inline) + `Input` + `Select` + `DatePicker`
- Add `Tag` for active filters

## Decision Heuristics

- Need strict form validation:
- Use `Form` validation rules and official status feedback patterns.

- Need destructive action safety:
- Use `Popconfirm` for inline actions and `Modal.confirm` for blocking confirms.

- Need global feedback after async calls:
- Use `message` for short success/error and `notification` for longer notices.

- Need very large list performance:
- Prefer built-in virtual scroll patterns on `Table`, `Tree`, `TreeSelect`, `Select`.

- Need list-like feed UI:
- Prefer `Table`/`Card` composition for new work; `List` is marked deprecated in current overview docs.

- Need global theme/locale behavior:
- Use `ConfigProvider` at app boundary.

- Need advanced charting/map/AI UI:
- Route to heavy components ecosystem (`Ant Design Charts`, `AntV L7`, `AntV G2`, `AntV S2`, `Ant Design X`) instead of forcing core components.

## React Implementation Checklist

Before coding:
- Confirm component exists in official docs.
- Confirm local `antd` version supports selected component.

While coding:
- Prefer official token/theme APIs instead of deep style overrides.
- Keep CSS overrides minimal and scoped.
- Keep focus and keyboard behavior intact for `Modal` and `Drawer`.

Before final response:
- Provide component list + key API choices.
- Mention version assumptions.
- Include concise React examples only for requested scope.

## Version Check Command

```bash
rg '"antd"|@ant-design' package.json pnpm-lock.yaml yarn.lock package-lock.json
```

If no result appears in lock files, check the package manager in use and inspect workspace root plus app subdirectories.
