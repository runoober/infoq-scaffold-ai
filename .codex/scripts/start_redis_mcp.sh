#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_FILE="${ROOT_DIR}/infoq-scaffold-backend/infoq-admin/src/main/resources/application-local.yml"

if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "missing backend local config: ${CONFIG_FILE}" >&2
  exit 1
fi

eval "$(ruby "${SCRIPT_DIR}/resolve_backend_local_mcp_env.rb" redis "${CONFIG_FILE}")"

required_vars=(REDIS_HOST REDIS_PORT REDIS_DB)
for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "missing required redis mcp config: ${name}" >&2
    exit 1
  fi
done

export REDIS_HOST REDIS_PORT REDIS_DB
export REDIS_PASSWORD="${REDIS_PASSWORD:-}"
export REDIS_READONLY="${REDIS_READONLY:-true}"

exec npx -y @wenit/redis-mcp-server
