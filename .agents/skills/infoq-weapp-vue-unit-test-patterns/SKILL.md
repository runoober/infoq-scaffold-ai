---
name: infoq-weapp-vue-unit-test-patterns
description: Build and scale unit tests for infoq-scaffold-frontend-weapp-vue (uni-app + Vue3 + TypeScript + Pinia) with Vitest + jsdom and deterministic runtime mocks. Use when users request 小程序 Vue 单测, weapp-vue unit tests, coverage backfill, 回归补测, or test-first bug fixes in the Vue mini-program workspace. Do not use this skill for backend, React, or infoq-scaffold-frontend-vue admin work.
---

# Infoq Weapp Vue Unit Test Patterns

## Scope

Use this skill only for `infoq-scaffold-frontend-weapp-vue`.

Current project baseline:
- Unit runner: Vitest (`vitest.config.ts`).
- Test env: `jsdom` + `tests/setup.ts` uni runtime/storage mocks.
- Coverage include: `src/api/**/*.ts`, `src/utils/{auth,crypto,env,errors,helpers,permissions,rsa,theme}.ts`, and `src/store/session.ts`.

Package manager policy:
- Prefer `pnpm`.
- If `pnpm` is unavailable, use equivalent `npm run ...` commands.

## Workflow

1. Confirm test baseline is healthy (`pnpm run test`).
2. Add or repair targeted tests first for the broken module.
3. Expand tests by priority:
   - P0: `src/api/request.ts`, `src/utils/auth.ts`, `src/utils/crypto.ts`, `src/utils/rsa.ts`, `src/utils/env.ts`
   - P1: `src/api/**/*.ts` contract wrappers and `src/utils/permissions.ts`
   - P2: `src/store/session.ts` state transitions and auth-dependent branches
4. Keep request error-message contract covered:
   - `src/api/request.ts` must not stringify opaque objects into `[object Object]`.
   - Add/keep regression cases for domain whitelist (`url not in domain list`) and opaque object rejections.
   - Unknown object errors must fallback to readable Chinese message.
5. Use deterministic mocks only:
   - Reuse `tests/setup.ts` default `uni`/`wx` mocks.
   - For branch-heavy modules, use `vi.doMock(...)` + `vi.resetModules()` per case.
6. If tests expose a real bug, patch source code immediately and add regression assertions.
7. Run validation in fixed order: targeted test -> full test -> coverage -> build checks.

## Guardrails

- Assert observable behavior and error branches; do not rely on broad snapshots.
- Do not weaken assertions or lower quality bars to make CI pass.
- Do not add silent fallback logic in product code to satisfy tests.
- Keep mocks narrow; avoid replacing full modules unless branch control requires it.
- If a change is wrong, revert that wrong change immediately before continuing.

## Finish Criteria

All required commands must pass:

```bash
cd infoq-scaffold-frontend-weapp-vue
pnpm run test
pnpm run test:coverage
pnpm run build:weapp:dev
pnpm run build:weapp
```

## References

- Commands: `references/commands.md`
- Priority matrix: `references/priority-matrix.md`
- Mock patterns: `references/mock-patterns.md`
