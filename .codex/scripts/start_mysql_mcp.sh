#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_FILE="${ROOT_DIR}/infoq-scaffold-backend/infoq-admin/src/main/resources/application-local.yml"

if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "missing backend local config: ${CONFIG_FILE}" >&2
  exit 1
fi

eval "$(ruby "${SCRIPT_DIR}/resolve_backend_local_mcp_env.rb" mysql "${CONFIG_FILE}")"

required_vars=(MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE)
for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "missing required mysql mcp config: ${name}" >&2
    exit 1
  fi
done

export MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE
export MYSQL_CONNECTION_LIMIT="${MYSQL_CONNECTION_LIMIT:-10}"
export MYSQL_READONLY="${MYSQL_READONLY:-true}"

exec npx -y @wenit/mysql-mcp-server
