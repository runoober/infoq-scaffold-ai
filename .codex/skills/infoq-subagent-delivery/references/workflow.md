# InfoQ Subagent Delivery Workflow

## Purpose

This skill standardizes how Codex decomposes a feature into expert-owned artifacts and code changes without mixing planning templates with real task documents.

## Directory Rules

- Reference templates live in `doc/agents/`
- Actual task documents live in `doc/plan/<task-slug>/`
- Use one task directory per requirement
- Recommended slug format: `YYYY-MM-DD-short-topic`

## Expert Ownership

| Agent | Primary output |
| --- | --- |
| `requirements_expert` | `PRD.md` |
| `product_designer` | `DESIGN.md` |
| `technical_designer` | `TRS.md` |
| `material_curator` | `MATERIAL.md` |
| `code_implementer` | repository code |
| `auto_fixer` | repository code fixes |
| `delivery_auditor` | `DELIVERY.md` |

## Cross-Workspace Rule

Every task must explicitly assess all three application workspaces:

- `infoq-scaffold-backend`
- `infoq-scaffold-frontend-react`
- `infoq-scaffold-frontend-vue`

If a workspace is not impacted, say so explicitly in `TRS.md` and `DELIVERY.md`.

## Planning Rule

When the user says a later phase should not be implemented yet, keep it in the planning documents as deferred scope. Do not silently remove it.

For this repository, future business-system visualization of agent orchestration belongs to a later phase and should be recorded as deferred scope until the user explicitly asks to implement it.

## Verification Rule

The delivery loop is not complete until the task directory records:

- verification commands
- verification outcomes
- residual risks
- rollback trigger or rollback conditions
