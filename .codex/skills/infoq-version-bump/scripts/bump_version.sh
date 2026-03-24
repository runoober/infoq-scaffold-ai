#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
DRY_RUN=0
TARGET_VERSION=""

usage() {
  cat <<'EOF'
Usage: bump_version.sh [--dry-run] [--repo-root <path>] <x.y.z>

Examples:
  bump_version.sh 2.0.3
  bump_version.sh --dry-run 2.0.3
  bump_version.sh --repo-root /path/to/infoq-scaffold-ai 2.0.3
EOF
}

fail() {
  echo "[version-bump] $*" >&2
  exit 1
}

require_command() {
  local name="$1"
  command -v "$name" >/dev/null 2>&1 || fail "missing required command: ${name}"
}

assert_file_exists() {
  local file="$1"
  [[ -f "${file}" ]] || fail "required file not found: ${file}"
}

assert_contains_fixed() {
  local file="$1"
  local text="$2"
  local desc="$3"
  if ! grep -Fq "${text}" "${file}"; then
    fail "verification failed for ${desc} in ${file}"
  fi
}

replace_perl() {
  local file="$1"
  local expr="$2"
  TARGET_VERSION="${TARGET_VERSION}" perl -0pi -e "${expr}" "${file}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --repo-root)
      REPO_ROOT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "${TARGET_VERSION}" ]]; then
        TARGET_VERSION="$1"
        shift
      else
        fail "unexpected argument: $1"
      fi
      ;;
  esac
done

[[ -n "${TARGET_VERSION}" ]] || {
  usage
  exit 1
}

[[ "${TARGET_VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "target version must match x.y.z, got: ${TARGET_VERSION}"

require_command perl
require_command grep
require_command find

REPO_ROOT="$(cd "${REPO_ROOT}" && pwd)"

ROOT_POM="${REPO_ROOT}/infoq-scaffold-backend/pom.xml"
BOM_POM="${REPO_ROOT}/infoq-scaffold-backend/infoq-core/infoq-core-bom/pom.xml"
REACT_PACKAGE="${REPO_ROOT}/infoq-scaffold-frontend-react/package.json"
VUE_PACKAGE="${REPO_ROOT}/infoq-scaffold-frontend-vue/package.json"
README_FILE="${REPO_ROOT}/README.md"
DEPLOY_DOC="${REPO_ROOT}/doc/docker-compose-deploy.md"
COMPOSE_FILE="${REPO_ROOT}/script/docker/docker-compose.yml"
BACKEND_DEPLOY_SCRIPT="${REPO_ROOT}/script/bin/infoq.sh"
PROJECT_REFERENCE_FILE="${REPO_ROOT}/.codex/skills/infoq-project-reference/references/project-reference.md"
SPRINGDOC_CONFIG_TEST="${REPO_ROOT}/infoq-scaffold-backend/infoq-plugin/infoq-plugin-doc/src/test/java/cc/infoq/common/doc/config/SpringDocConfigTest.java"
SPRINGDOC_PROPERTIES_TEST="${REPO_ROOT}/infoq-scaffold-backend/infoq-plugin/infoq-plugin-doc/src/test/java/cc/infoq/common/doc/config/properties/SpringDocPropertiesTest.java"

FILES_TO_CHECK=(
  "${ROOT_POM}"
  "${BOM_POM}"
  "${REACT_PACKAGE}"
  "${VUE_PACKAGE}"
  "${README_FILE}"
  "${DEPLOY_DOC}"
  "${COMPOSE_FILE}"
  "${BACKEND_DEPLOY_SCRIPT}"
  "${PROJECT_REFERENCE_FILE}"
  "${SPRINGDOC_CONFIG_TEST}"
  "${SPRINGDOC_PROPERTIES_TEST}"
)

for file in "${FILES_TO_CHECK[@]}"; do
  assert_file_exists "${file}"
done

SQL_FILES=()
while IFS= read -r file; do
  SQL_FILES+=("${file}")
done < <(find "${REPO_ROOT}/sql" -maxdepth 1 -type f -name 'infoq_scaffold_*.sql' | sort)

if [[ "${#SQL_FILES[@]}" -ne 1 ]]; then
  fail "expected exactly one sql/infoq_scaffold_*.sql file, found ${#SQL_FILES[@]}"
fi

SQL_FILE_PATH="${SQL_FILES[0]}"
SQL_FILE_REL="${SQL_FILE_PATH#"${REPO_ROOT}/"}"

assert_contains_fixed "${README_FILE}" "${SQL_FILE_REL}" "README SQL reference"
assert_contains_fixed "${DEPLOY_DOC}" "${SQL_FILE_REL}" "deploy doc SQL reference"
assert_contains_fixed "${COMPOSE_FILE}" "${SQL_FILE_REL}" "docker compose SQL reference"
assert_contains_fixed "${BACKEND_DEPLOY_SCRIPT}" "${SQL_FILE_REL}" "backend deploy script SQL reference"
assert_contains_fixed "${PROJECT_REFERENCE_FILE}" "${SQL_FILE_REL}" "project reference SQL reference"

echo "[version-bump] repo root: ${REPO_ROOT}"
echo "[version-bump] target version: ${TARGET_VERSION}"
echo "[version-bump] sql file kept unchanged: ${SQL_FILE_REL}"
echo "[version-bump] managed files:"
printf '  - %s\n' \
  "${ROOT_POM#${REPO_ROOT}/}" \
  "${BOM_POM#${REPO_ROOT}/}" \
  "${REACT_PACKAGE#${REPO_ROOT}/}" \
  "${VUE_PACKAGE#${REPO_ROOT}/}" \
  "${README_FILE#${REPO_ROOT}/}" \
  "${DEPLOY_DOC#${REPO_ROOT}/}" \
  "${COMPOSE_FILE#${REPO_ROOT}/}" \
  "${SPRINGDOC_CONFIG_TEST#${REPO_ROOT}/}" \
  "${SPRINGDOC_PROPERTIES_TEST#${REPO_ROOT}/}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "[version-bump] dry-run complete; no files modified."
  exit 0
fi

replace_perl "${ROOT_POM}" 's{<revision>[^<]+</revision>}{<revision>$ENV{TARGET_VERSION}</revision>}'
replace_perl "${BOM_POM}" 's{<revision>[^<]+</revision>}{<revision>$ENV{TARGET_VERSION}</revision>}'
replace_perl "${REACT_PACKAGE}" 's{("version"\s*:\s*")[^"]+(")}{$1$ENV{TARGET_VERSION}$2}'
replace_perl "${VUE_PACKAGE}" 's{("version"\s*:\s*")[^"]+(")}{$1$ENV{TARGET_VERSION}$2}'
replace_perl "${README_FILE}" 's{(当前版本：`)[^`]+(`)}{$1$ENV{TARGET_VERSION}$2}'
replace_perl "${DEPLOY_DOC}" 's{(当前文档对应项目基线版本为 `)[^`]+(`。)}{$1$ENV{TARGET_VERSION}$2}'
replace_perl "${COMPOSE_FILE}" 's{(image:\s+infoq/infoq-admin:)[0-9]+\.[0-9]+\.[0-9]+}{$1$ENV{TARGET_VERSION}}'
replace_perl "${COMPOSE_FILE}" 's{(image:\s+infoq/infoq-frontend-vue:)[0-9]+\.[0-9]+\.[0-9]+}{$1$ENV{TARGET_VERSION}}'
replace_perl "${COMPOSE_FILE}" 's{(image:\s+infoq/infoq-frontend-react:)[0-9]+\.[0-9]+\.[0-9]+}{$1$ENV{TARGET_VERSION}}'
replace_perl "${SPRINGDOC_CONFIG_TEST}" 's{(info\.setVersion\(")[^"]+("\);)}{$1$ENV{TARGET_VERSION}$2}g'
replace_perl "${SPRINGDOC_CONFIG_TEST}" 's{(assertEquals\(")[^"]+(",\s*openAPI\.getInfo\(\)\.getVersion\(\)\);)}{$1$ENV{TARGET_VERSION}$2}g'
replace_perl "${SPRINGDOC_PROPERTIES_TEST}" 's{(info\.setVersion\(")[^"]+("\);)}{$1$ENV{TARGET_VERSION}$2}g'
replace_perl "${SPRINGDOC_PROPERTIES_TEST}" 's{(assertEquals\(")[^"]+(",\s*properties\.getInfo\(\)\.getVersion\(\)\);)}{$1$ENV{TARGET_VERSION}$2}g'

assert_contains_fixed "${ROOT_POM}" "<revision>${TARGET_VERSION}</revision>" "backend revision"
assert_contains_fixed "${BOM_POM}" "<revision>${TARGET_VERSION}</revision>" "bom revision"
assert_contains_fixed "${REACT_PACKAGE}" "\"version\": \"${TARGET_VERSION}\"" "react package version"
assert_contains_fixed "${VUE_PACKAGE}" "\"version\": \"${TARGET_VERSION}\"" "vue package version"
assert_contains_fixed "${README_FILE}" "当前版本：\`${TARGET_VERSION}\`" "README current version"
assert_contains_fixed "${DEPLOY_DOC}" "当前文档对应项目基线版本为 \`${TARGET_VERSION}\`。" "deploy doc baseline version"
assert_contains_fixed "${COMPOSE_FILE}" "image: infoq/infoq-admin:${TARGET_VERSION}" "admin image tag"
assert_contains_fixed "${COMPOSE_FILE}" "image: infoq/infoq-frontend-vue:${TARGET_VERSION}" "vue image tag"
assert_contains_fixed "${COMPOSE_FILE}" "image: infoq/infoq-frontend-react:${TARGET_VERSION}" "react image tag"
assert_contains_fixed "${SPRINGDOC_CONFIG_TEST}" "info.setVersion(\"${TARGET_VERSION}\");" "springdoc config test setVersion"
assert_contains_fixed "${SPRINGDOC_CONFIG_TEST}" "assertEquals(\"${TARGET_VERSION}\", openAPI.getInfo().getVersion());" "springdoc config test assert"
assert_contains_fixed "${SPRINGDOC_PROPERTIES_TEST}" "info.setVersion(\"${TARGET_VERSION}\");" "springdoc properties test setVersion"
assert_contains_fixed "${SPRINGDOC_PROPERTIES_TEST}" "assertEquals(\"${TARGET_VERSION}\", properties.getInfo().getVersion());" "springdoc properties test assert"

echo "[version-bump] version bump completed successfully."
echo "[version-bump] suggested follow-up:"
echo "  rg -n \"${TARGET_VERSION//./\\.}\" README.md doc script infoq-scaffold-backend infoq-scaffold-frontend-react infoq-scaffold-frontend-vue"
echo "  mvn -pl infoq-plugin/infoq-plugin-doc -am -DskipTests=false -Dsurefire.failIfNoSpecifiedTests=false -Dtest=SpringDocConfigTest,SpringDocPropertiesTest test"
