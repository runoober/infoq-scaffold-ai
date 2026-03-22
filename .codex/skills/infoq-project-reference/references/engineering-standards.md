# InfoQ Engineering Standards

## Failure Policy

- In product code, prefer explicit failures over silent fallbacks, swallowed errors, fake success paths, or mock-only shortcuts that hide the root problem.
- If a fallback is truly necessary for safety, privacy, security, or a user-requested compatibility requirement, make it explicit, documented, easy to disable, and user-approved before introducing it.
- Surface operational failures with clear errors, exceptions, logs, or failing tests so root causes stay visible.

## Engineering Baseline

- Follow DRY, YAGNI, and separation of concerns.
- Prefer clear naming and pragmatic abstractions over clever indirection.
- Add concise comments only for critical intent or non-obvious logic.
- Prefer minimal, targeted edits over large rewrites unless broader restructuring is explicitly required by the user or the task.
- Avoid cleanup-driven refactors that mainly make code look "cleaner" while changing behavior or increasing risk without clear product value.
- Keep implementation scoped to the requested outcome; do not add opportunistic features, broad side quests, or speculative improvements.
- Remove dead code and obsolete compatibility branches when changing behavior, unless compatibility is explicitly required by the user.
- If a change is later found to be wrong, revert the incorrect code immediately before continuing and do not leave unused, unreachable, or commented-out code behind.
- Consider time and space complexity when dealing with heavy IO, loops, large payloads, or memory-sensitive flows.
- Handle edge cases explicitly instead of assuming ideal input.

## Acceptance And Scope

- Before implementation, define an acceptance contract in the same task context covering functional scope, explicit non-goals, exception handling expectations, required logs or observability, and rollback trigger or rollback conditions.
- If the acceptance contract is missing, ambiguous, or internally conflicting, resolve the gap or surface it explicitly before coding.
- Keep the acceptance contract close to the implementation request so later validation can be checked against the same source of truth.

## Code Metrics

- Function length: keep within 50 non-blank lines; split helpers when exceeded.
- File size: target 300 lines or less; split by responsibility when exceeded.
- Nesting depth: keep within 3 levels; use guard clauses or early returns to flatten control flow.
- Positional parameters: keep within 3; use an options object when more context is needed.
- Cyclomatic complexity: target 10 or less per function; decompose branching logic when higher.
- No magic numbers: extract named constants for non-obvious values.

## Decoupling And State

- Prefer dependency injection in business logic; avoid hard-wiring concrete implementations when a parameter, interface, or adapter keeps the code easier to test and evolve.
- Prefer immutable-first code where practical: use `const`, `readonly`, immutable structures, and returned copies instead of mutating inputs or shared global state.
- Do not mutate function parameters unless the mutation is the explicit API contract.

## Security Baseline

- Never hardcode secrets, API keys, or credentials in source files.
- Use environment variables, config files outside source control, or secret managers for secrets.
- Use parameterized queries for database access; never concatenate raw user input into SQL.
- Validate and sanitize external input at system boundaries, including user input, API payloads, and file content.

## Testing And Validation

- Keep code testable and prefer automated verification whenever feasible.
- Prefer deterministic checks, formatting, and reproducible validation over ad-hoc manual confidence.
- Do not change tests, mocks, warning thresholds, or validation settings merely to force green results while leaving the real defect unresolved.
- Do not delete assertions, weaken expectations, or suppress build/test warnings unless the user explicitly approves the tradeoff and the reason is documented in the change.
- Backend unit tests should use a hard timeout of 60 seconds to avoid stuck runs.
- When changing behavior, verify the relevant path instead of relying on static reasoning alone.

## Execution Workflow

- Work in minimal closed loops and change one category at a time, for example behavior, tests, config, or deployment scripts.
- Default validation order is: main-flow verification, targeted automated tests, lint/build or equivalent static checks, then diff review.
- Do not mix unrelated refactors with behavior changes in the same batch unless the user explicitly requests a bundled change.
- Review the resulting diff before handoff to confirm the final patch still matches the acceptance contract.

## Release Guardrails

- For releasable changes, keep dependency versions and lockfiles consistent; do not update one without the other when the ecosystem uses lockfiles.
- Verify required environment variables, config files, migration prerequisites, and external dependencies before execution or deployment.
- Require explicit confirmation before destructive or high-risk operations affecting shared environments, persistent data, or deployment state.
- When release risk exists, define rollback trigger and rollback path before rollout instead of treating rollback as an afterthought.

## Pre-Release Checklist

- Check performance impact for hot paths, large payloads, startup time, and critical database or cache access.
- Ensure alerting or observability covers new critical paths, operational failures, and silent-failure risks.
- Confirm rollback commands or rollback scripts exist when config, SQL, dependency, or infrastructure changes are included.
- Call out every unchecked validation item as residual risk in the final handoff.
