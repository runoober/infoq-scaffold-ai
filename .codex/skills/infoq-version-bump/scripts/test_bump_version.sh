#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
TMP_DIR="$(mktemp -d)"
FIXTURE_ROOT="${TMP_DIR}/repo"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

copy_file() {
  local rel="$1"
  mkdir -p "${FIXTURE_ROOT}/$(dirname "${rel}")"
  cp "${REPO_ROOT}/${rel}" "${FIXTURE_ROOT}/${rel}"
}

assert_contains_fixed() {
  local file="$1"
  local text="$2"
  if ! grep -Fq "${text}" "${file}"; then
    echo "[version-bump-test] missing expected text in ${file}: ${text}" >&2
    exit 1
  fi
}

FILES=(
  "README.md"
  "doc/docker-compose-deploy.md"
  "script/bin/infoq.sh"
  "script/docker/docker-compose.yml"
  ".codex/skills/infoq-project-reference/references/project-reference.md"
  "infoq-scaffold-backend/pom.xml"
  "infoq-scaffold-backend/infoq-core/infoq-core-bom/pom.xml"
  "infoq-scaffold-backend/infoq-plugin/infoq-plugin-doc/src/test/java/cc/infoq/common/doc/config/SpringDocConfigTest.java"
  "infoq-scaffold-backend/infoq-plugin/infoq-plugin-doc/src/test/java/cc/infoq/common/doc/config/properties/SpringDocPropertiesTest.java"
  "infoq-scaffold-frontend-react/package.json"
  "infoq-scaffold-frontend-vue/package.json"
  "sql/infoq_scaffold_2.0.0.sql"
)

for rel in "${FILES[@]}"; do
  copy_file "${rel}"
done

bash "${SCRIPT_DIR}/bump_version.sh" --repo-root "${FIXTURE_ROOT}" 9.9.9 >/tmp/infoq-version-bump-test.log

assert_contains_fixed "${FIXTURE_ROOT}/infoq-scaffold-backend/pom.xml" "<revision>9.9.9</revision>"
assert_contains_fixed "${FIXTURE_ROOT}/infoq-scaffold-backend/infoq-core/infoq-core-bom/pom.xml" "<revision>9.9.9</revision>"
assert_contains_fixed "${FIXTURE_ROOT}/infoq-scaffold-frontend-react/package.json" "\"version\": \"9.9.9\""
assert_contains_fixed "${FIXTURE_ROOT}/infoq-scaffold-frontend-vue/package.json" "\"version\": \"9.9.9\""
assert_contains_fixed "${FIXTURE_ROOT}/README.md" "当前版本：\`9.9.9\`"
assert_contains_fixed "${FIXTURE_ROOT}/doc/docker-compose-deploy.md" "当前文档对应项目基线版本为 \`9.9.9\`。"
assert_contains_fixed "${FIXTURE_ROOT}/script/docker/docker-compose.yml" "image: infoq/infoq-admin:9.9.9"
assert_contains_fixed "${FIXTURE_ROOT}/script/docker/docker-compose.yml" "image: infoq/infoq-frontend-vue:9.9.9"
assert_contains_fixed "${FIXTURE_ROOT}/script/docker/docker-compose.yml" "image: infoq/infoq-frontend-react:9.9.9"
assert_contains_fixed "${FIXTURE_ROOT}/README.md" "sql/infoq_scaffold_2.0.0.sql"
assert_contains_fixed "${FIXTURE_ROOT}/script/bin/infoq.sh" "sql/infoq_scaffold_2.0.0.sql"
assert_contains_fixed "${FIXTURE_ROOT}/script/docker/docker-compose.yml" "sql/infoq_scaffold_2.0.0.sql"
assert_contains_fixed "${FIXTURE_ROOT}/.codex/skills/infoq-project-reference/references/project-reference.md" "sql/infoq_scaffold_2.0.0.sql"

echo "[version-bump-test] pass"
