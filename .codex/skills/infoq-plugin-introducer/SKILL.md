---
name: infoq-plugin-introducer
description: Introduce or refactor plugins in this repository with the established governance model (基座必需 / 通用能力 / 可配置软开关), including backend+frontend wiring and verification. Use when users ask for 新增插件, 引入插件, 插件开关化, 可拔插插件, plugin scaffold, plugin onboarding, or plugin governance updates.
---

# Infoq Plugin Introducer

## Scope

Use this skill when adding a new plugin module, migrating an existing capability into `infoq-plugin`, or deciding whether a plugin should be fixed, reusable, or switchable.

## Quick Execute

Generate a concrete onboarding plan first:

```bash
bash .codex/skills/infoq-plugin-introducer/scripts/generate_plugin_plan.sh \
  --name infoq-plugin-xxx \
  --class toggle \
  --frontend auto
```

Class options:
- `fixed`
- `reusable`
- `toggle`

Optional output file:

```bash
bash .codex/skills/infoq-plugin-introducer/scripts/generate_plugin_plan.sh \
  --name infoq-plugin-xxx \
  --class reusable \
  --out /tmp/plugin-plan.md
```

## Decision First

Classify the plugin before coding:

1. `基座固定保留`:
- Core runtime dependency, removal will break base app boot/auth/data path.
- Keep as stable dependency, no runtime toggle required.

2. `通用能力插件`:
- Reusable capability for multiple business modules (annotation/tool/event style).
- Keep plugin module and let business module opt in by dependency.

3. `可配置软关闭插件`:
- Feature can be enabled/disabled by config without deleting dependency.
- Keep dependency in system module; default `enabled=false`.
- If frontend relies on it, add paired `VITE_APP_*` toggle.

If classification is unclear, read:
- `doc/plugin-catalog.md`
- `references/plugin-matrix.md`

## Backend Integration

For a new plugin module `infoq-plugin-xxx`:

1. Module registration:
- Add module under `infoq-scaffold-backend/infoq-plugin/pom.xml`.

2. Version management:
- Add version property/dependency management in `infoq-scaffold-backend/infoq-core/infoq-core-bom/pom.xml`.

3. Consumer dependency:
- Add dependency in target business module `pom.xml` (usually `infoq-scaffold-backend/infoq-modules/infoq-system/pom.xml`).
- For shared domain capabilities, prefer consuming from `infoq-core-data` or specific module that truly needs it.

4. Configuration:
- For soft-toggle plugin, define backend key in `application.yml` and default to `false`.
- Avoid hard-coding plugin startup in non-conditional configs.

5. Coupling control:
- Keep plugin API narrow (annotation, interface, facade, auto-config).
- Do not leak plugin internals to business modules.

## Frontend Integration (Only if needed)

If plugin affects client runtime behavior:

1. Add env toggles:
- `infoq-scaffold-frontend-vue/.env.development`
- `infoq-scaffold-frontend-vue/.env.production`

2. Gate runtime logic in frontend bootstrap/hooks/utils with env toggle.

3. Keep fallback path when toggle is `false` (no broken UI or hanging requests).

## Verification Baseline

Prefer `pnpm` for frontend verification. If `pnpm` is unavailable in the current environment, use the equivalent `npm` command.

Run at least:

```bash
cd infoq-scaffold-backend && mvn clean package -P dev -pl infoq-modules/infoq-system -am
cd infoq-scaffold-frontend-vue && pnpm run build:prod
```

If plugin impacts login/auth/runtime routes, run related smoke checks:
- `infoq-backend-smoke-test`
- `infoq-login-success-check`
- `infoq-browser-automation` (for UI/runtime verification)

## Exit Criteria

All must be true:

1. Plugin classification is documented (fixed/reusable/config-toggle).
2. POM wiring is complete and minimal.
3. Backend toggle defaults are correct (`false` for switchable plugins).
4. Frontend toggle is paired when client behavior is involved.
5. Backend package and frontend build both pass.
6. If runtime changed, smoke checks pass and no obvious regression.

## Resources

- Governance source: `doc/plugin-catalog.md`
- Quick matrix: `references/plugin-matrix.md`
