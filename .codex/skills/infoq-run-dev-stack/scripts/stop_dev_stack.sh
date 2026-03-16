#!/usr/bin/env bash
set -euo pipefail

STATE_FILE="/tmp/infoq-dev-stack.state"

if [[ ! -f "${STATE_FILE}" ]]; then
  echo "[stack] no state file found: ${STATE_FILE}"
  exit 0
fi

# shellcheck source=/dev/null
source "${STATE_FILE}"

stop_one() {
  local name="$1"
  local pid="$2"
  if [[ -z "${pid}" ]]; then
    echo "[stack] ${name}: no pid recorded"
    return
  fi
  if kill -0 "${pid}" >/dev/null 2>&1; then
    kill "${pid}" >/dev/null 2>&1 || true
    sleep 1
    if kill -0 "${pid}" >/dev/null 2>&1; then
      kill -9 "${pid}" >/dev/null 2>&1 || true
    fi
    echo "[stack] ${name} stopped (pid=${pid})"
  else
    echo "[stack] ${name} already stopped (pid=${pid})"
  fi
}

stop_one "backend" "${STARTED_BACKEND_PID:-}"
stop_one "vue frontend" "${STARTED_VUE_PID:-${STARTED_FRONTEND_PID:-}}"
stop_one "react frontend" "${STARTED_REACT_PID:-}"

rm -f "${STATE_FILE}"
echo "[stack] removed state file: ${STATE_FILE}"
