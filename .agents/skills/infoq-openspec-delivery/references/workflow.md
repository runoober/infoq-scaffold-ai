# InfoQ OpenSpec Delivery Workflow

## Purpose

This skill standardizes how Codex handles feature work through OpenSpec artifacts and code changes, with subagents as an explicit multi-expert mode when requested.

## Directory Rules

- Durable project context lives in `openspec/project.md`
- Current truth specs live in `openspec/specs/`
- Active change artifacts live in `openspec/changes/<change-id>/`

## Execution Modes

- Default mode: the main agent creates or updates `proposal.md`, `tasks.md`, and relevant spec deltas locally before implementation
- Multi-expert mode: when the user explicitly requests subagents or multi-expert execution, use the expert ownership model below

## Expert Ownership

| Agent | Primary output |
| --- | --- |
| `requirements_expert` | `proposal.md` + spec deltas |
| `product_designer` | `design.md` when UX decisions matter |
| `technical_designer` | `tasks.md` |
| `material_curator` | `materials.md` when copy/mock/icon guidance matters |
| `code_implementer` | repository code + task checklist updates |
| `auto_fixer` | repository code fixes + verification reruns |
| `delivery_auditor` | archive decision or explicit blockers |

## Cross-Workspace Rule

Every change must explicitly assess all three application workspaces:

- `infoq-scaffold-backend`
- `infoq-scaffold-frontend-react`
- `infoq-scaffold-frontend-vue`

If a workspace is not impacted, record that in `tasks.md` with the reason.

## Planning Rule

When the user says a later phase should not be implemented yet, keep it in the active OpenSpec artifacts as deferred scope. Do not silently remove it.

## Verification Rule

The delivery loop is not complete until the active change records:

- verification commands
- verification outcomes
- residual risks or blockers
- rollback trigger or rollback conditions
