#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
LOGIN_SCRIPT="${REPO_ROOT}/.codex/skills/infoq-login-success-check/scripts/verify_login.sh"

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
CLIENT_ID="${CLIENT_ID:-e5cd7e4891bf95d1d19206ce24a7b32e}"

if [[ ! -x "${LOGIN_SCRIPT}" ]]; then
  echo "login skill script not found or not executable: ${LOGIN_SCRIPT}" >&2
  exit 1
fi

RAW_OUTPUT="$(bash "${LOGIN_SCRIPT}" --print-token "$@")"
TOKEN="$(printf '%s\n' "${RAW_OUTPUT}" | awk -F= '/^TOKEN=/{print $2}' | tail -n 1)"

if [[ -z "${TOKEN}" ]]; then
  echo "failed to acquire token; login output:" >&2
  echo "${RAW_OUTPUT}" >&2
  exit 1
fi

ROUTERS_JSON="$(curl -fsS "${BASE_URL}/system/menu/getRouters" -H "Authorization: Bearer ${TOKEN}" -H "clientid: ${CLIENT_ID}")"

ROUTERS_JSON="${ROUTERS_JSON}" node - <<'NODE'
const payload = JSON.parse(process.env.ROUTERS_JSON || '{}');
if (payload.code !== 200 || !Array.isArray(payload.data)) {
  console.error('router api failed:', payload.msg || payload.code);
  process.exit(1);
}

const paths = new Set();

function joinPath(prefix, path) {
  if (!path) return prefix || '/';
  if (path.startsWith('/')) return path;
  const base = (prefix || '').replace(/\/$/, '');
  return `${base}/${path}`.replace(/\/+/g, '/');
}

function walk(nodes, prefix = '') {
  for (const node of nodes) {
    const fullPath = joinPath(prefix, node.path || '');
    if (node.component && node.component !== 'Layout') {
      paths.add(fullPath);
    }
    if (Array.isArray(node.children) && node.children.length > 0) {
      walk(node.children, fullPath);
    }
  }
}

walk(payload.data);
for (const p of Array.from(paths).sort()) {
  console.log(p);
}
NODE
