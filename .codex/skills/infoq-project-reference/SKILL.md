---
name: infoq-project-reference
description: Load this repository's static project reference, including workspace layout, key entry/config paths, architecture and naming rules, UTF-8 and package-manager conventions, build/run/test/deploy commands, branch/PR expectations, and engineering/security/validation standards. Use when users ask about project structure, startup/build/test/deploy procedures, config or entry files, coding conventions, code quality rules, security baselines, test policies, or when a task needs repo-specific reference context that does not belong in always-on AGENTS memory.
---

# InfoQ Project Reference

Use this skill when the task needs stable repository reference material that is useful, but not important enough to keep in AGENTS for every turn.

## Workflow

1. Read `references/project-reference.md` for repository layout, commands, and delivery conventions.
2. Read `references/engineering-standards.md` when the task needs coding standards, security rules, test policy, code metrics, or implementation quality guidance.
3. Load only the sections relevant to the task instead of pasting the entire reference into context.
4. Treat the referenced files and commands as hints, then verify the current repository state before making changes.
5. Keep high-priority global rules in `AGENTS.md`; do not move universal rules such as retrieval-first reasoning, AI coding guardrails, UTF-8 encoding, or explicit-failure policy out of AGENTS.

## Typical Triggers

- The user asks where project modules, entry files, config files, infrastructure files, or SQL files live.
- The user asks how to build, run, test, deploy, or validate this repository.
- The task depends on package naming, layering, indentation, encoding, commit rules, branch naming, or PR expectations.
- The task needs engineering baselines such as code metrics, dependency injection, immutability, security boundaries, explicit-failure rules, or backend unit-test timeout policy.
- The task needs repo reference context but does not justify inflating top-level AGENTS lines.

## Reference

Read:

- `references/project-reference.md`
- `references/engineering-standards.md`
