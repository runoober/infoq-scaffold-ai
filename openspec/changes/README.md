# OpenSpec Changes

Use `openspec/changes/<change-id>/` for active work.

Recommended structure:

```text
openspec/changes/<change-id>/
├── proposal.md
├── design.md            # optional
├── tasks.md
├── materials.md         # optional
├── review.md            # optional when archive is blocked or a written audit trail is needed
└── specs/
    └── <capability>/spec.md
```

Rules:

- `proposal.md` should include `Why`, `What Changes`, acceptance contract, and risks
- `design.md` is only required when UX or technical tradeoffs need a durable decision record
- `tasks.md` is the execution checklist and verification source of truth
- `materials.md` is optional and only for meaningful copy/mock/icon guidance
- `review.md` is optional and only for blocked audits or an explicit written acceptance summary
- Spec deltas live under `specs/` inside the change directory
- Archive or merge only after verification evidence is complete

Seeded example:

- `openspec/changes/demo-user-import-openspec/`: a non-archived demo change showing how to express proposal, design, tasks, materials, review, and a user-management spec delta without pretending that code was delivered
- `openspec/changes/archive/`: accepted changes after their updates have been merged back into `openspec/specs/`
