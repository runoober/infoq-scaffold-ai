# Mock Patterns

## Reuse Global Runtime Mocks

`tests/setup.ts` already provides:
- `uni` storage and navigation stubs
- `request` and `uploadFile` stubs
- `wx.env.USER_DATA_PATH`

Use these defaults first. Add per-test overrides only when a specific branch needs it.

## Branch-Isolated Module Mocks

For `src/api/request.ts` and similar modules:

1. `vi.resetModules()` before importing target module.
2. `vi.doMock(...)` dependencies (`env/auth/crypto/rsa` modules).
3. Import target module after mocks are installed.

This pattern keeps branch tests deterministic and avoids cross-test state pollution.

## Store Testing Pattern

For `src/store/session.ts`:

1. Mock `@/api` methods with `vi.hoisted`.
2. Use `setActivePinia(createPinia())` in `beforeEach`.
3. Assert state transitions and helper method delegation through store APIs.

## Failure Branches

Always add explicit error-path assertions:
- network/request rejects
- logout rejects
- token missing branches
- malformed env or unsupported runtime branches
