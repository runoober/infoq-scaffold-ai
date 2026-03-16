---
name: infoq-codebase-index
description: Maintain and query synchronized file indexes for infoq-scaffold-backend, infoq-scaffold-frontend-react, and infoq-scaffold-frontend-vue. Use this skill whenever the user asks where a class, component, page, API file, mapper, service, or route lives, asks for a repository-wide file index, or when any file/class is added, removed, renamed, or moved in those three workspaces; run the sync script before finishing such edits so the skill references and AGENTS routing stay current.
---

# InfoQ Codebase Index

Use this skill for two cases:

1. Broad code lookup across `infoq-scaffold-backend`, `infoq-scaffold-frontend-react`, and `infoq-scaffold-frontend-vue`.
2. Post-edit index refresh after file/class add, delete, rename, move, or large structural changes in those workspaces.

## Workflow

1. Read only the relevant generated reference file:
   - Backend: `references/backend-index.md`
   - React: `references/frontend-react-index.md`
   - Vue: `references/frontend-vue-index.md`
2. Narrow candidate files from the index, then use repository search (`rg`) and file reads for the real source of truth.
3. If the current turn changes files or class names under any target workspace, run:

```bash
python3 .codex/skills/infoq-codebase-index/scripts/sync_indexes.py
```

This refreshes the skill references and normalizes the related `AGENTS.md` rules.

## Reference Loading

- Read `references/usage.md` first when the workspace is unclear or when you need the refresh policy.
- Do not load all three index files unless the task is explicitly cross-workspace.
- The generated indexes come from each sub-repository's `git ls-files`, so they track repository-managed files. If the current turn created a new file, refresh first.
