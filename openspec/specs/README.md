# OpenSpec Source Of Truth

Use `openspec/specs/` for the repository's current truth about stable product behavior.

Guidelines:

- Organize specs by business capability, not by backend/React/Vue workspace
- Update source-of-truth specs only after an active change is accepted
- Keep requirement language concrete and scenario-driven
- Use `SHALL` or `MUST` in requirements

Suggested capability buckets for this scaffold:

- `auth/`
- `user-management/`
- `menu-permission/`
- `notification/`
- `file-storage/`
- `platform-governance/`

Current seeded spec:

- `platform-governance/spec.md`: default delivery workflow, cross-workspace assessment, and archive gate
