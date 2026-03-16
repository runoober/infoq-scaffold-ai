#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
LOGIN_SCRIPT="${REPO_ROOT}/.codex/skills/infoq-login-success-check/scripts/verify_login.sh"

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

printf "(localStorage.setItem('Admin-Token','%s'),location.href='/index','ok')\n" "${TOKEN}"
