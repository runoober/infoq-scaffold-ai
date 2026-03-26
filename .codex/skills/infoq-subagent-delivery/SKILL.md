---
name: infoq-subagent-delivery
description: Orchestrate this repository's Codex subagent workflow for multi-expert feature delivery. Use when users ask to use subagents/custom agents/multi-expert workflows, maintain PRD/DESIGN/TRS/MATERIAL/DELIVERY planning docs, or run requirement -> design -> technical design -> materials -> code -> auto-fix -> delivery across infoq-scaffold-backend, infoq-scaffold-frontend-react, and infoq-scaffold-frontend-vue.
---

# InfoQ Subagent Delivery

Use this skill when the user wants Codex to deliver a feature through specialized subagents instead of a single linear agent.

## Preconditions

- Repository-level subagents live under `.codex/agents/`
- Global subagent config lives at `.codex/config.toml`
- `doc/agents/` contains reference templates only
- Actual task outputs must be written under `doc/plan/<task-slug>/`

## Workflow

1. Read `AGENTS.md` and the relevant repository files before delegating.
2. Create a task slug in the form `YYYY-MM-DD-short-topic`.
3. Initialize the task directory with:

```bash
bash .codex/skills/infoq-subagent-delivery/scripts/init_plan_dir.sh <task-slug>
```

4. Explicitly ask Codex to spawn these custom agents in order:
   - `requirements_expert`
   - `product_designer`
   - `technical_designer`
   - `material_curator`
   - `code_implementer`
   - `auto_fixer`
   - `delivery_auditor`
5. Keep the dependency order strict:
   - `requirements_expert -> product_designer`
   - `technical_designer` and `material_curator` may run in parallel after `DESIGN.md`
   - `code_implementer -> auto_fixer -> delivery_auditor`
6. Require every agent to use `doc/agents/*.template.md` only as references and write actual task outputs to `doc/plan/<task-slug>/`.
7. If the user explicitly defers a later phase, require that deferred work to be recorded in the plan documents instead of being silently dropped.

## Acceptance Contract

Before implementation, define one acceptance contract that covers:

- functional scope
- non-goals
- exception handling and explicit blockers
- required logs or verification evidence
- rollback trigger or rollback conditions

If any part is missing or conflicting, stop and surface the gap before coding.

## Validation

Use the TRS as the source of truth for verification, then validate in this order:

1. Main flow verification
2. Targeted tests
3. Lint or build for impacted workspaces
4. Diff review

Minimum expectations by workspace when changed:

- Backend: targeted Maven tests plus compilation for the affected module(s)
- React: `pnpm test` and `pnpm build`
- Vue: `pnpm test:unit` and `pnpm run build:prod`

If a check is not applicable or cannot run, record the blocker in `doc/plan/<task-slug>/DELIVERY.md`.

## Output Contract

Each task directory should end with:

- `PRD.md`
- `DESIGN.md`
- `TRS.md`
- `MATERIAL.md`
- `DELIVERY.md`

`doc/agents/` must remain template-only.

## Reference

Read:

- `references/workflow.md`
- `doc/agents/README.md`
- `doc/plan/README.md`
