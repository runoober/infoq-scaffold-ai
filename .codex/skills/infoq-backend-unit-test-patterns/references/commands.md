# Commands

## Targeted Class Test

```bash
mvn -pl infoq-modules/infoq-system -am \
  -DskipTests=false \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=<ClassNameTest> test
```

## Targeted Mapper XML Integration Test

```bash
mvn -pl infoq-modules/infoq-system -am \
  -DskipTests=false \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=Sys*MapperXmlIntegrationTest test
```

## Single Mapper XML Integration Class

```bash
mvn -pl infoq-modules/infoq-system -am \
  -DskipTests=false \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=SysUserMapperXmlIntegrationTest test
```

## Multi Class Test

```bash
mvn -pl infoq-modules/infoq-system -am \
  -DskipTests=false \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=ClassATest,ClassBTest,ClassCTest test
```

## Full Module Test

```bash
mvn -pl infoq-modules/infoq-system -am -DskipTests=false test
```

## Coverage Gap Scan (Class-Level)

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

## Packaging And Smoke

```bash
mvn -pl infoq-modules/infoq-system -am clean package -P dev -DskipTests=false
bash .codex/skills/infoq-backend-smoke-test/scripts/run_smoke.sh
```
