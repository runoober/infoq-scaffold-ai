# InfoQ Engineering Standards

## Failure Policy

- In product code, prefer explicit failures over silent fallbacks, swallowed errors, fake success paths, or mock-only shortcuts that hide the root problem.
- If a fallback is truly necessary for safety, privacy, security, or a user-requested compatibility requirement, make it explicit, documented, easy to disable, and user-approved before introducing it.
- Surface operational failures with clear errors, exceptions, logs, or failing tests so root causes stay visible.

## Engineering Baseline

- Follow DRY, YAGNI, and separation of concerns.
- Prefer clear naming and pragmatic abstractions over clever indirection.
- Add concise comments only for critical intent or non-obvious logic.
- Remove dead code and obsolete compatibility branches when changing behavior, unless compatibility is explicitly required by the user.
- Consider time and space complexity when dealing with heavy IO, loops, large payloads, or memory-sensitive flows.
- Handle edge cases explicitly instead of assuming ideal input.

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
- Backend unit tests should use a hard timeout of 60 seconds to avoid stuck runs.
- When changing behavior, verify the relevant path instead of relying on static reasoning alone.
