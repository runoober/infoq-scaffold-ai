---
name: infoq-version-bump
description: Bump this repository's project version consistently across backend Maven revision, frontend package versions, docker image tags, release docs, and version assertions. Use whenever the user asks to 升级版本号, 更新项目版本, 发布到某个 x.y.z 版本, 同步 README/docker/pom/package 的版本号, or wants a repo-wide version bump. Default policy keeps the existing SQL bootstrap file name unchanged; do not rename SQL files automatically unless the user explicitly requests a separate SQL-file task.
---

# Infoq Version Bump

## Execute

Run:

```bash
bash .codex/skills/infoq-version-bump/scripts/bump_version.sh 2.0.3
```

Common variants:

```bash
# Preview checks without editing files
bash .codex/skills/infoq-version-bump/scripts/bump_version.sh --dry-run 2.0.3

# Run against another checkout or a temporary fixture
bash .codex/skills/infoq-version-bump/scripts/bump_version.sh \
  --repo-root /path/to/infoq-scaffold-ai \
  2.0.3
```

## What This Skill Changes

The script updates only the repository-owned release version fields:

- `infoq-scaffold-backend/pom.xml`
- `infoq-scaffold-backend/infoq-core/infoq-core-bom/pom.xml`
- `infoq-scaffold-frontend-react/package.json`
- `infoq-scaffold-frontend-vue/package.json`
- `README.md`
- `doc/docker-compose-deploy.md`
- `script/docker/docker-compose.yml`
- `infoq-scaffold-backend/infoq-plugin/infoq-plugin-doc/.../SpringDocConfigTest.java`
- `infoq-scaffold-backend/infoq-plugin/infoq-plugin-doc/.../SpringDocPropertiesTest.java`

## Default SQL Policy

- Detect the current SQL bootstrap file from `sql/infoq_scaffold_*.sql`.
- Keep that filename unchanged.
- Validate that README, deploy docs, backend deploy script, docker compose, and project reference still point to that same SQL file.
- If SQL references drift, fail explicitly instead of renaming SQL files behind the user's back.

This policy is deliberate for this repository: project version bumps and SQL baseline file renames are separate decisions.

## Failure Rules

Fail immediately when any of these is true:

- target version is not `x.y.z`
- repository root cannot be resolved
- required target files are missing
- zero or multiple `sql/infoq_scaffold_*.sql` files exist
- SQL references do not match the detected SQL file
- any managed version field cannot be verified after replacement

## Validation

After a real run:

```bash
bash .codex/skills/infoq-version-bump/scripts/test_bump_version.sh
```

Optional project-level checks after a bump:

```bash
rg -n "2\\.0\\.3" README.md doc script infoq-scaffold-backend infoq-scaffold-frontend-react infoq-scaffold-frontend-vue
mvn -pl infoq-plugin/infoq-plugin-doc -am -DskipTests=false -Dsurefire.failIfNoSpecifiedTests=false -Dtest=SpringDocConfigTest,SpringDocPropertiesTest test
```

## Resources

- Managed targets and guardrails: `references/targets.md`
- Main script: `scripts/bump_version.sh`
- Regression smoke check for the script: `scripts/test_bump_version.sh`
