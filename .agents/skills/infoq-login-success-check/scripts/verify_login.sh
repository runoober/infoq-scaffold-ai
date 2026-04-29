#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/infoq-scaffold-backend"
JAR_PATH="${BACKEND_DIR}/infoq-admin/target/infoq-admin.jar"

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
TEMP_PORT="${TEMP_PORT:-18081}"
PROFILE="${PROFILE:-local}"
WAIT_SECONDS="${WAIT_SECONDS:-90}"

CLIENT_ID="${CLIENT_ID:-e5cd7e4891bf95d1d19206ce24a7b32e}"
USERNAME="${USERNAME:-}"
PASSWORD="${PASSWORD:-}"
LOGIN_CANDIDATES="${LOGIN_CANDIDATES:-admin:admin123,dept:666666,owner:666666,admin:123456}"
RSA_PUBLIC_KEY="${RSA_PUBLIC_KEY:-MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKoR8mX0rGKLqzcWmOzbfj64K8ZIgOdHnzkXSOVOZbFu/TJhZ7rFAN+eaGkl3C4buccQd/EjEsj9ir7ijT7h96MCAwEAAQ==}"

AUTO_TEMP=1
BUILD_BACKEND=0
KEEP_SERVER=0
PRINT_TOKEN=0

TARGET_BASE_URL="${BASE_URL}"
TEMP_PID=""
TEMP_LOG=""

usage() {
  cat <<'USAGE'
Usage: verify_login.sh [options]

Options:
  --base-url <url>          Base URL of running backend (default: http://127.0.0.1:8080).
  --temp-port <port>        Temp backend port when auto-starting (default: 18081).
  --profile <name>          Spring profile for temp backend (default: local).
  --build                   Build backend jar before temp startup.
  --no-auto-temp            Disable auto temp backend when captcha is enabled.
  --keep-server             Keep temp backend alive after checks.
  --username <name>         Preferred login username.
  --password <pwd>          Preferred login password.
  --login-candidates <csv>  Fallback list, e.g. "admin:admin123,dept:666666".
  --print-token             Print TOKEN=<jwt> when login succeeds.
  -h, --help                Show help.
USAGE
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

port_pid() {
  local port="$1"
  lsof -t -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null | head -n 1 || true
}

json_captcha_enabled() {
  local raw="$1"
  node -e 'const fs=require("fs"); const s=fs.readFileSync(0,"utf8"); try { const j=JSON.parse(s); process.stdout.write(String(!!(j && j.data && j.data.captchaEnabled))); } catch { process.stdout.write("unknown"); }' <<< "${raw}"
}

cleanup() {
  if [[ -n "${TEMP_PID}" && "${KEEP_SERVER}" -eq 0 ]]; then
    kill "${TEMP_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --temp-port)
      TEMP_PORT="$2"
      shift 2
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --build)
      BUILD_BACKEND=1
      shift
      ;;
    --no-auto-temp)
      AUTO_TEMP=0
      shift
      ;;
    --keep-server)
      KEEP_SERVER=1
      shift
      ;;
    --username)
      USERNAME="$2"
      shift 2
      ;;
    --password)
      PASSWORD="$2"
      shift 2
      ;;
    --login-candidates)
      LOGIN_CANDIDATES="$2"
      shift 2
      ;;
    --print-token)
      PRINT_TOKEN=1
      shift
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

start_temp_backend() {
  local temp_base="http://127.0.0.1:${TEMP_PORT}"

  if [[ "${BUILD_BACKEND}" -eq 1 || ! -f "${JAR_PATH}" ]]; then
    echo "[login-check] building backend jar..."
    (
      cd "${BACKEND_DIR}"
      mvn -pl infoq-admin -am -DskipTests package
    )
  fi

  if [[ ! -f "${JAR_PATH}" ]]; then
    echo "[login-check] backend jar not found: ${JAR_PATH}" >&2
    exit 1
  fi

  local pid
  pid="$(port_pid "${TEMP_PORT}")"
  if [[ -n "${pid}" ]]; then
    if curl -fsS "${temp_base}/auth/code" >/dev/null 2>&1; then
      echo "[login-check] reuse temp backend on ${temp_base} (pid=${pid})"
      TARGET_BASE_URL="${temp_base}"
      return
    fi
    echo "[login-check] port ${TEMP_PORT} is occupied by non-target service (pid=${pid})" >&2
    exit 1
  fi

  TEMP_LOG="/tmp/infoq-login-check-${TEMP_PORT}-$(date +%s).log"
  echo "[login-check] starting temp backend on ${temp_base} with captcha disabled"
  nohup java -jar "${JAR_PATH}" --spring.profiles.active="${PROFILE}" --server.port="${TEMP_PORT}" --captcha.enable=false >"${TEMP_LOG}" 2>&1 &
  TEMP_PID="$!"

  if ! wait_http "${temp_base}/auth/code" "${WAIT_SECONDS}"; then
    echo "[login-check] temp backend failed to become ready. log=${TEMP_LOG}" >&2
    tail -n 200 "${TEMP_LOG}" >&2 || true
    exit 1
  fi

  TARGET_BASE_URL="${temp_base}"
  echo "[login-check] temp backend ready: ${TARGET_BASE_URL}"
}

code_resp="$(curl -fsS "${BASE_URL}/auth/code" || true)"
if [[ -n "${code_resp}" ]]; then
  captcha_enabled="$(json_captcha_enabled "${code_resp}")"
  if [[ "${captcha_enabled}" == "true" ]]; then
    if [[ "${AUTO_TEMP}" -eq 1 ]]; then
      echo "[login-check] captcha enabled on ${BASE_URL}; switching to temp backend"
      start_temp_backend
    else
      echo "[login-check] captcha enabled on ${BASE_URL}; use auto temp backend or disable captcha" >&2
      exit 1
    fi
  else
    TARGET_BASE_URL="${BASE_URL}"
    echo "[login-check] using existing backend: ${TARGET_BASE_URL}"
  fi
else
  if [[ "${AUTO_TEMP}" -eq 1 ]]; then
    echo "[login-check] ${BASE_URL} unreachable; starting temp backend"
    start_temp_backend
  else
    echo "[login-check] ${BASE_URL} unreachable and auto temp backend disabled" >&2
    exit 1
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[login-check] node is required but not found in PATH" >&2
  exit 1
fi

BASE_URL="${TARGET_BASE_URL}" \
CLIENT_ID="${CLIENT_ID}" \
USERNAME="${USERNAME}" \
PASSWORD="${PASSWORD}" \
LOGIN_CANDIDATES="${LOGIN_CANDIDATES}" \
RSA_PUBLIC_KEY="${RSA_PUBLIC_KEY}" \
PRINT_TOKEN="${PRINT_TOKEN}" \
node "${SCRIPT_DIR}/login_check.mjs"

if [[ "${KEEP_SERVER}" -eq 1 && -n "${TEMP_PID}" ]]; then
  echo "[login-check] keep-server enabled: pid=${TEMP_PID}, log=${TEMP_LOG}"
fi
