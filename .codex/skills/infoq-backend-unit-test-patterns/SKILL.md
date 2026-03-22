---
name: infoq-backend-unit-test-patterns
description: Build deterministic backend tests for the infoq-scaffold-backend project using reusable patterns for service/controller/mapper-default/mapper-xml-integration/plugin/aspect classes, including @Tag(dev) policy, mock boundaries, @MybatisTest+H2 setup, mapper default-method strategy, and maven execution commands. Use when users request backend unit tests, test coverage expansion, branch regression tests, mapper XML validation, bug reproduction by tests, or refactoring with test-first validation in infoq-scaffold-backend.
---

# Infoq Backend Unit Test Patterns

## Overview

Use this skill to add stable unit tests in `infoq-scaffold-backend/infoq-modules/infoq-system/src/test/java` without pulling in full runtime dependencies unless necessary.
Always run one minimal verification test first for the selected type, then batch-expand to sibling classes.

## Workflow

1. Classify the target into one of the supported types: `service`, `controller`, `mapper-default`, `mapper-xml-integration`, `plugin`, `aspect`.
2. Copy the matching pattern from `references/` and adapt package/class/method names.
3. Add `@Tag("dev")` on the class, because Maven Surefire filters by `profiles.active`.
4. For `mapper-xml-integration`, prefer shared composed annotation `cc.infoq.system.mapper.support.MapperXmlIT` and split assertions by mapper class (`Sys*MapperXmlIntegrationTest`) under `mapper/xml`.
5. For controller/service mass backfill, scan class-level gaps first:

```bash
python3 - <<'PY'
import pathlib
root = pathlib.Path('infoq-modules/infoq-system/src/main/java/cc/infoq/system')
test_root = pathlib.Path('infoq-modules/infoq-system/src/test/java/cc/infoq/system')
tests = {p.stem[:-4] for p in test_root.rglob('*Test.java') if p.stem.endswith('Test')}
for rel in ['controller', 'service/impl']:
    classes = [p.stem for p in (root / rel).rglob('*.java')]
    missing = sorted([c for c in classes if c not in tests])
    print(rel, 'missing=', len(missing))
    if missing:
        print('  ' + ', '.join(missing))
PY
```

6. Run targeted tests first:

```bash
mvn -pl infoq-modules/infoq-system -am \
  -DskipTests=false \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=<ClassNameTest> test
```

7. If tests expose a real bug, patch production code immediately and rerun.
8. After the type is validated once, add same-type tests in batches and rerun targeted suites.
9. Run full module verification and smoke test before closing.

## Type Selection Rules

- `service`: class under `service/impl`, mapper/service collaboration, branch logic.
- `controller`: class under `controller`, request/result mapping and guard logic.
- `mapper-default`: only mapper interfaces that contain Java `default` methods.
  Pure SQL declaration methods in mapper interfaces are not unit-test targets; move them to integration tests with DB + MyBatis XML.
- `mapper-xml-integration`: pure mapper declaration methods (`abstract`) backed by XML SQL.
  Use `@MapperXmlIT` (`@MybatisTest` + H2 + SQL fixtures) and one test class per mapper to validate SQL semantics.
- `plugin`: utility classes under `infoq-plugin-*` (e.g. `PageQuery`, `TableDataInfo`).
- `aspect`: AOP classes where pure helper methods can be unit tested without full proxy wiring.

## Guardrails

- Keep unit tests deterministic; mock mapper/external dependencies.
- Avoid direct runtime integration in unit tests unless class initialization requires Spring context.
- Prefer verifying business branches over only happy-path.
- Keep tests independent from environment credentials and network.
- Do not weaken assertions, broaden mocks, mute warnings, raise thresholds, or add fake-success paths merely to make tests/build pass; fix the real issue or stop and document a user-approved exception.
- If a source or test change is identified as wrong, revert the incorrect code immediately before continuing and do not leave dead, unreachable, or uncalled code behind.
- For `@Tag` strategy: default to `@Tag("dev")` to align with current Surefire groups.
- Avoid `@SpringBootTest` for pure unit tests in this project unless a `@SpringBootConfiguration` is intentionally provided in test scope.
- For mapper XML integration tests:
  - Prefer shared `@MapperXmlIT` and dedicated SQL fixtures under `src/test/resources/sql/...`.
  - Keep data minimal and deterministic; default to shared `mapper_it` fixtures, isolate suite fixtures only when cross-mapper coupling makes assertions unstable.
  - Ensure XML bindings load explicitly through test properties (`mybatis.mapper-locations`).
  - If mapper method signature returns `Page<T>` and runtime pagination plugin is absent in `@MybatisTest` slice, execute statement via `SqlSessionTemplate.selectList(statementId, params)` to verify SQL semantics.
- Watch static initialization traps:
  - `JsonUtils`, `RedisUtils`, `MapstructUtils` can pull Spring/bean state indirectly.
  - For auth strategy tests, prefer branch-level testing (including reflection on private helper methods) over full `login` path if static utilities are coupled to runtime context.
  - For dictionary/service tests, prefer business methods that avoid mapper-struct static converters unless integration wiring is needed.

## Mapper Boundary

- Unit test required:
  - Mapper `default` methods that perform Java-side branching/aggregation/delegation and can run with mocks.
- Unit test optional/skip:
  - Pure mapper declarations (`abstract` methods mapped by XML/annotation SQL).
  - These are better covered by integration tests (`@MybatisTest` or module-level integration tests).
- Known unstable in plain unit context:
  - Methods that force MyBatis lambda column cache resolution without MyBatis runtime.
  - Examples from this project: `SysDeptMapper.selectDeptAndChildById` (when exercising internal lambda query path), `SysUserRoleMapper.selectUserIdsByRoleId`.
  - Strategy: either test only stable delegation defaults, or move unstable methods to integration tests.

## Finish Criteria

All must pass:

```bash
mvn -pl infoq-modules/infoq-system -am -DskipTests=false test
mvn -pl infoq-modules/infoq-system -am clean package -P dev -DskipTests=false
bash .codex/skills/infoq-backend-smoke-test/scripts/run_smoke.sh
```

## References

- Service pattern: `references/service-pattern.md`
- Controller pattern: `references/controller-pattern.md`
- Mapper pattern: `references/mapper-pattern.md`
- Mapper XML integration pattern: `references/mapper-integration-pattern.md`
- Plugin/aspect patterns: `references/plugin-aspect-pattern.md`
- Command recipes: `references/commands.md`

Use only the reference file required for the current type to keep context small.
