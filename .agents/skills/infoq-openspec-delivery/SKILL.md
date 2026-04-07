---
name: infoq-openspec-delivery
description: Orchestrate this repository's high-impact OpenSpec workflow. Use for new features, API contract changes, cross-workspace delivery, explicit OpenSpec/spec-driven requests, or subagents/multi-expert work across backend/React/Vue.
---

# InfoQ OpenSpec Delivery

Use this skill for L3/L2 OpenSpec work (high-impact or explicitly requested OpenSpec tasks). For L1 small scoped fixes without contract changes, this skill is optional. If the user explicitly asks for subagents or multi-expert execution, follow the expert sequence below.

## Preconditions

- `openspec/project.md` stores durable project context
- `openspec/specs/` stores the current source of truth
- `openspec/changes/<change-id>/` stores active planning artifacts and spec deltas

## Workflow

1. Read `AGENTS.md`, `openspec/project.md`, the relevant specs, and the real repository files before delegating.
2. Create a change id in the form `verb-noun` or `YYYY-MM-DD-short-topic`.
3. Initialize the change directory with:

```bash
bash .agents/skills/infoq-openspec-delivery/scripts/init_change_dir.sh <change-id>
```

4. If the user did not ask for subagents, create or update `proposal.md`, `tasks.md`, and necessary spec deltas before implementation (for L2 Lite, `proposal.md` + `tasks.md` are the minimum).
5. If the user explicitly asks for subagents or multi-expert execution, spawn these custom agents in order:
   - `requirements_expert`
   - `product_designer` when UI or interaction decisions matter
   - `technical_designer`
   - `material_curator` only when copy, mock data, or icon guidance is materially helpful
   - `code_implementer`
   - `auto_fixer`
   - `delivery_auditor`
6. Keep the dependency order strict when subagents are used:
   - `requirements_expert -> product_designer(optional) -> technical_designer`
   - `material_curator` may run after `design.md` exists, or after the parent agent decides that no design file is needed
   - `code_implementer -> auto_fixer -> delivery_auditor`
7. Keep all active planning artifacts inside `openspec/changes/<change-id>/`.
8. Structure `proposal.md` with explicit `Why` and `What Changes` sections before the acceptance contract;OpenSpec 文档正文默认中文，路径名称、命令、文件名保持英文原样。
9. If the user explicitly defers a later phase, record that deferred scope in `proposal.md`, `design.md`, or `tasks.md` instead of silently dropping it.

## Acceptance Contract

Before implementation, define one acceptance contract in `proposal.md` that covers:

- functional scope
- non-goals
- exception handling and explicit blockers
- required logs or verification evidence
- rollback trigger or rollback conditions

If any part is missing or conflicting, stop and surface the gap before coding.

## Validation

Use `tasks.md` and the spec delta as the source of truth for verification, then validate in this order:

1. Main flow verification
2. Targeted tests
3. Lint or build for impacted workspaces
4. Diff review

Minimum expectations by workspace when changed:

- Backend: targeted Maven tests plus compilation for the affected module(s)
- React: `pnpm test` and `pnpm build`
- Vue: `pnpm test:unit` and `pnpm run build:prod`

If a check is not applicable or cannot run, leave the change active and record the blocker explicitly instead of claiming archive readiness.

## Output Contract

Each active change directory should end with:

- `proposal.md`
- `design.md` when needed
- `tasks.md`
- `materials.md` when needed
- spec deltas under `specs/.../spec.md`

After acceptance, archive the change so approved updates become part of `openspec/specs/`.

## Reference

Read:

- `references/workflow.md`
- `openspec/project.md`
- `openspec/specs/README.md`
- `openspec/changes/README.md`
