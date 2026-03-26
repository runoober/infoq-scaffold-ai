# Managed Targets

## Version Fields Updated

- `infoq-scaffold-backend/pom.xml`
  - root `<revision>`
- `infoq-scaffold-backend/infoq-core/infoq-core-bom/pom.xml`
  - BOM `<revision>`
- `infoq-scaffold-frontend-react/package.json`
  - top-level `"version"`
- `infoq-scaffold-frontend-vue/package.json`
  - top-level `"version"`
- `README.md`
  - `![Version](https://img.shields.io/badge/Version-x.y.z-...)`
- `doc/docker-compose-deploy.md`
  - `当前文档对应项目基线版本为 \`x.y.z\`。`
- `script/docker/docker-compose.yml`
  - `infoq/infoq-admin:x.y.z`
  - `infoq/infoq-frontend-vue:x.y.z`
  - `infoq/infoq-frontend-react:x.y.z`
- `infoq-scaffold-backend/infoq-plugin/infoq-plugin-doc/src/test/java/cc/infoq/common/doc/config/SpringDocConfigTest.java`
  - `info.setVersion("x.y.z")`
  - `assertEquals("x.y.z", openAPI.getInfo().getVersion())`
- `infoq-scaffold-backend/infoq-plugin/infoq-plugin-doc/src/test/java/cc/infoq/common/doc/config/properties/SpringDocPropertiesTest.java`
  - `info.setVersion("x.y.z")`
  - `assertEquals("x.y.z", properties.getInfo().getVersion())`

## SQL Filename Guard

The skill does not rename SQL files automatically.

It validates that these files still reference the currently existing SQL bootstrap file:

- `README.md`
- `doc/docker-compose-deploy.md`
- `script/bin/infoq.sh`
- `script/docker/docker-compose.yml`
- `.agents/skills/infoq-project-reference/references/project-reference.md`

If those references drift from the real file under `sql/`, the script fails and requires a deliberate follow-up task.

## Non-Goals

- do not rename `sql/infoq_scaffold_*.sql`
- do not update dependency versions such as third-party package or framework versions
- do not edit lockfiles
- do not run release, deploy, or image push steps
