#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

BACKEND_DIR="${REPO_ROOT}/infoq-scaffold-backend"
VUE_DIR="${REPO_ROOT}/infoq-scaffold-frontend-vue"
REACT_DIR="${REPO_ROOT}/infoq-scaffold-frontend-react"
BACKEND_JAR="${BACKEND_DIR}/infoq-admin/target/infoq-admin.jar"

BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_TARGET="${FRONTEND_TARGET:-vue}"
VUE_PORT="${VUE_PORT:-5173}"
REACT_PORT="${REACT_PORT:-5174}"
PROFILE="${PROFILE:-dev}"
WAIT_SECONDS="${WAIT_SECONDS:-90}"

BUILD_BACKEND=0
FORCE_RESTART=0
BACKEND_ONLY=0
FRONTEND_ONLY=0
LEGACY_FRONTEND_PORT=""

STATE_FILE="/tmp/infoq-dev-stack.state"
LOG_DIR="/tmp/infoq-dev-stack"
mkdir -p "${LOG_DIR}"
BACKEND_LOG="${LOG_DIR}/backend-${BACKEND_PORT}.log"
VUE_LOG="${LOG_DIR}/frontend-vue-${VUE_PORT}.log"
REACT_LOG="${LOG_DIR}/frontend-react-${REACT_PORT}.log"

STARTED_BACKEND_PID=""
STARTED_VUE_PID=""
STARTED_REACT_PID=""

usage() {
  cat <<'USAGE'
Usage: start_dev_stack.sh [options]

Options:
  --build-backend          Build backend jar before startup.
  --force-restart          Restart service if target port is already in use.
  --backend-only           Start backend only.
  --frontend-only          Start frontend only.
  --backend-port <port>    Backend HTTP port (default: 8080).
  --frontend <target>      Frontend target: vue|react|both (default: vue).
  --frontend-port <port>   单前端模式端口，兼容旧参数。
  --vue-port <port>        Vue dev port (default: 5173).
  --react-port <port>      React dev port (default: 5174).
  --frontend-host <host>   Frontend host (default: 127.0.0.1).
  --profile <name>         Spring profile (default: dev).
  -h, --help               Show help.
USAGE
}

port_pid() {
  local port="$1"
  lsof -t -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null | head -n 1 || true
}

wait_http() {
  local url="$1"
  local max_wait="$2"
  local i
  for i in $(seq 1 "${max_wait}"); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

kill_pid_if_running() {
  local pid="$1"
  if [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1; then
    kill "${pid}" >/dev/null 2>&1 || true
    sleep 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-backend)
      BUILD_BACKEND=1
      shift
      ;;
    --force-restart)
      FORCE_RESTART=1
      shift
      ;;
    --backend-only)
      BACKEND_ONLY=1
      shift
      ;;
    --frontend-only)
      FRONTEND_ONLY=1
      shift
      ;;
    --backend-port)
      BACKEND_PORT="$2"
      shift 2
      ;;
    --frontend-port)
      LEGACY_FRONTEND_PORT="$2"
      shift 2
      ;;
    --frontend)
      FRONTEND_TARGET="$2"
      shift 2
      ;;
    --vue-port)
      VUE_PORT="$2"
      shift 2
      ;;
    --react-port)
      REACT_PORT="$2"
      shift 2
      ;;
    --frontend-host)
      FRONTEND_HOST="$2"
      shift 2
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "${BACKEND_ONLY}" -eq 1 && "${FRONTEND_ONLY}" -eq 1 ]]; then
  echo "--backend-only and --frontend-only cannot be used together." >&2
  exit 1
fi

if [[ ! -d "${BACKEND_DIR}" || ! -d "${VUE_DIR}" || ! -d "${REACT_DIR}" ]]; then
  echo "Repository layout not found under ${REPO_ROOT}" >&2
  exit 1
fi

if [[ "${FRONTEND_TARGET}" != "vue" && "${FRONTEND_TARGET}" != "react" && "${FRONTEND_TARGET}" != "both" ]]; then
  echo "Unknown frontend target: ${FRONTEND_TARGET}" >&2
  exit 1
fi

if [[ -n "${LEGACY_FRONTEND_PORT}" ]]; then
  if [[ "${FRONTEND_TARGET}" == "both" ]]; then
    echo "--frontend-port 仅适用于单前端模式，请改用 --vue-port / --react-port" >&2
    exit 1
  fi
  if [[ "${FRONTEND_TARGET}" == "vue" ]]; then
    VUE_PORT="${LEGACY_FRONTEND_PORT}"
  else
    REACT_PORT="${LEGACY_FRONTEND_PORT}"
  fi
fi

if [[ "${FRONTEND_ONLY}" -ne 1 ]]; then
  local_backend_pid="$(port_pid "${BACKEND_PORT}")"
  if [[ -n "${local_backend_pid}" && "${FORCE_RESTART}" -eq 1 ]]; then
    echo "[stack] restarting backend on port ${BACKEND_PORT} (pid=${local_backend_pid})"
    kill_pid_if_running "${local_backend_pid}"
    local_backend_pid=""
  fi

  if [[ "${BUILD_BACKEND}" -eq 1 || ! -f "${BACKEND_JAR}" ]]; then
    echo "[stack] building backend jar..."
    (
      cd "${BACKEND_DIR}"
      mvn -pl infoq-admin -am -DskipTests package
    )
  fi

  if [[ ! -f "${BACKEND_JAR}" ]]; then
    echo "[stack] backend jar not found: ${BACKEND_JAR}" >&2
    exit 1
  fi

  if [[ -z "${local_backend_pid}" ]]; then
    echo "[stack] starting backend on :${BACKEND_PORT}"
    nohup java -jar "${BACKEND_JAR}" --spring.profiles.active="${PROFILE}" --server.port="${BACKEND_PORT}" >"${BACKEND_LOG}" 2>&1 &
    STARTED_BACKEND_PID="$!"
    if ! wait_http "http://127.0.0.1:${BACKEND_PORT}/auth/code" "${WAIT_SECONDS}"; then
      echo "[stack] backend failed to become ready. log=${BACKEND_LOG}" >&2
      tail -n 120 "${BACKEND_LOG}" >&2 || true
      exit 1
    fi
    echo "[stack] backend ready: http://127.0.0.1:${BACKEND_PORT}/auth/code (pid=${STARTED_BACKEND_PID})"
  else
    echo "[stack] backend already running on :${BACKEND_PORT} (pid=${local_backend_pid})"
  fi
fi

start_frontend() {
  local name="$1"
  local dir="$2"
  local port="$3"
  local log_file="$4"
  local pid_var="$5"
  local local_frontend_pid
  local_frontend_pid="$(port_pid "${port}")"

  if [[ -n "${local_frontend_pid}" && "${FORCE_RESTART}" -eq 1 ]]; then
    echo "[stack] restarting ${name} frontend on port ${port} (pid=${local_frontend_pid})"
    kill_pid_if_running "${local_frontend_pid}"
    local_frontend_pid=""
  fi

  if [[ -n "${local_frontend_pid}" ]]; then
    echo "[stack] ${name} frontend already running on :${port} (pid=${local_frontend_pid})"
    return 0
  fi

  echo "[stack] starting ${name} frontend on ${FRONTEND_HOST}:${port}"
  if command -v pnpm >/dev/null 2>&1; then
    FRONT_CMD="pnpm dev --host ${FRONTEND_HOST} --port ${port} --open false"
  else
    FRONT_CMD="npm run dev -- --host ${FRONTEND_HOST} --port ${port} --open false"
  fi

  (
    cd "${dir}"
    nohup bash -lc "${FRONT_CMD}" >"${log_file}" 2>&1 &
    echo $! > "${LOG_DIR}/${name}.pid.tmp"
  )

  local started_pid
  started_pid="$(cat "${LOG_DIR}/${name}.pid.tmp")"
  rm -f "${LOG_DIR}/${name}.pid.tmp"
  printf -v "${pid_var}" '%s' "${started_pid}"

  if ! wait_http "http://${FRONTEND_HOST}:${port}/" "${WAIT_SECONDS}"; then
    echo "[stack] ${name} frontend failed to become ready. log=${log_file}" >&2
    tail -n 120 "${log_file}" >&2 || true
    exit 1
  fi

  echo "[stack] ${name} frontend ready: http://${FRONTEND_HOST}:${port}/ (pid=${started_pid})"
}

if [[ "${BACKEND_ONLY}" -ne 1 ]]; then
  case "${FRONTEND_TARGET}" in
    vue)
      start_frontend "vue" "${VUE_DIR}" "${VUE_PORT}" "${VUE_LOG}" STARTED_VUE_PID
      ;;
    react)
      start_frontend "react" "${REACT_DIR}" "${REACT_PORT}" "${REACT_LOG}" STARTED_REACT_PID
      ;;
    both)
      start_frontend "vue" "${VUE_DIR}" "${VUE_PORT}" "${VUE_LOG}" STARTED_VUE_PID
      start_frontend "react" "${REACT_DIR}" "${REACT_PORT}" "${REACT_LOG}" STARTED_REACT_PID
      ;;
  esac
fi

cat > "${STATE_FILE}" <<STATE
STARTED_BACKEND_PID=${STARTED_BACKEND_PID}
STARTED_VUE_PID=${STARTED_VUE_PID}
STARTED_REACT_PID=${STARTED_REACT_PID}
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_HOST=${FRONTEND_HOST}
FRONTEND_TARGET=${FRONTEND_TARGET}
VUE_PORT=${VUE_PORT}
REACT_PORT=${REACT_PORT}
BACKEND_LOG=${BACKEND_LOG}
VUE_LOG=${VUE_LOG}
REACT_LOG=${REACT_LOG}
STATE

echo "[stack] state file: ${STATE_FILE}"
echo "[stack] backend log: ${BACKEND_LOG}"
if [[ "${FRONTEND_TARGET}" == "vue" || "${FRONTEND_TARGET}" == "both" ]]; then
  echo "[stack] vue log: ${VUE_LOG}"
fi
if [[ "${FRONTEND_TARGET}" == "react" || "${FRONTEND_TARGET}" == "both" ]]; then
  echo "[stack] react log: ${REACT_LOG}"
fi
