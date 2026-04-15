# Suite Coverage Checklist

## `smoke` Suite

- `smoke.routes`
  - Core route reachability checks for login + authenticated routes when token/session is available.

## `core` Suite

- `smoke.routes`
- `auth.flow`
- `profile.flow`
- `notice.flow`
- `permission.flow`

Use this suite for fast daily regression without full-route traversal.

## `full` Suite (Default For Interface Coverage)

- `api.contract`
  - Enumerates `src/api/**/*.ts`.
  - Ensures each API wrapper export has transport (`request` or `uploadFile`), method (for request), and url.
- `full.routes`
  - Traverses all registered routes from `ALL_ROUTES`.
- `auth.flow`, `profile.flow`, `notice.flow`, `permission.flow`
  - Verifies core authenticated interactions and permission boundaries.

For “all interfaces coverage” and “all routes smoke”, use `--suite full`.
