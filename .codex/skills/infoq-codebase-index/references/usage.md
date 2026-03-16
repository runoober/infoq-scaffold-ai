# InfoQ Codebase Index Usage

Use this skill when you need a fast map of repository files before deeper reads.

Relevant generated references:
- `backend-index.md`: `infoq-scaffold-backend`
- `frontend-react-index.md`: `infoq-scaffold-frontend-react`
- `frontend-vue-index.md`: `infoq-scaffold-frontend-vue`

Recommended lookup flow:
1. Pick the likely workspace.
2. Read the matching generated index file.
3. Narrow to candidate paths.
4. Use `rg "<class-or-symbol>" <workspace>` and open the real source files.

Refresh rule:
- After add/delete/rename/move/class-name change in any of the three workspaces, run `python3 .codex/skills/infoq-codebase-index/scripts/sync_indexes.py`.
- The sync script rebuilds the generated references and rewrites the related `AGENTS.md` lines so future turns auto-trigger this skill.
