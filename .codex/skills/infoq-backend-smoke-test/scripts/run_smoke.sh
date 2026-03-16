#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

JAR_REL_PATH="infoq-scaffold-backend/infoq-admin/target/infoq-admin.jar"
PORT="${SMOKE_PORT:-18080}"
HOST="${SMOKE_HOST:-127.0.0.1}"
ROLE_ID="${SMOKE_ROLE_ID:-3}"
DICT_TYPE="${SMOKE_DICT_TYPE:-sys_yes_no}"
CLIENT_ID="${SMOKE_CLIENT_ID:-e5cd7e4891bf95d1d19206ce24a7b32e}"
USERNAME="${SMOKE_USERNAME:-}"
PASSWORD="${SMOKE_PASSWORD:-}"
LOGIN_CANDIDATES="${SMOKE_LOGIN_CANDIDATES:-dept:666666,owner:666666,admin:123456}"
RSA_PUBLIC_KEY="${SMOKE_RSA_PUBLIC_KEY:-MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKoR8mX0rGKLqzcWmOzbfj64K8ZIgOdHnzkXSOVOZbFu/TJhZ7rFAN+eaGkl3C4buccQd/EjEsj9ir7ijT7h96MCAwEAAQ==}"

BUILD_FIRST=0
KEEP_SERVER=0

usage() {
  cat <<'EOF'
Usage: run_smoke.sh [options]

Options:
  --build                    Build backend jar before smoke testing.
  --keep-server              Keep backend process alive after checks.
  --port <port>              Server port (default: 18080).
  --host <host>              Server host (default: 127.0.0.1).
  --role-id <id>             Role ID for role menu/dept checks (default: 3).
  --dict-type <type>         Dict type check target (default: sys_yes_no).
  --client-id <id>           Client ID for login (default: e5cd...).
  --username <name>          Preferred login username.
  --password <pwd>           Preferred login password.
  --login-candidates <list>  Comma list like "dept:666666,owner:666666".
  --jar <path>               Jar path relative to repo root.
  -h, --help                 Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build)
      BUILD_FIRST=1
      shift
      ;;
    --keep-server)
      KEEP_SERVER=1
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --host)
      HOST="$2"
      shift 2
      ;;
    --role-id)
      ROLE_ID="$2"
      shift 2
      ;;
    --dict-type)
      DICT_TYPE="$2"
      shift 2
      ;;
    --client-id)
      CLIENT_ID="$2"
      shift 2
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
    --jar)
      JAR_REL_PATH="$2"
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

JAR_PATH="${REPO_ROOT}/${JAR_REL_PATH}"
BASE_URL="http://${HOST}:${PORT}"
LOG_FILE="/tmp/infoq-smoke-${PORT}-$(date +%s).log"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" && "${KEEP_SERVER}" -eq 0 ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if ! command -v node >/dev/null 2>&1; then
  echo "node is required but not found in PATH" >&2
  exit 1
fi

if [[ "${BUILD_FIRST}" -eq 1 || ! -f "${JAR_PATH}" ]]; then
  echo "[smoke] building backend jar..."
  (
    cd "${REPO_ROOT}/infoq-scaffold-backend"
    mvn -pl infoq-admin -am -DskipTests clean package
  )
fi

if [[ ! -f "${JAR_PATH}" ]]; then
  echo "[smoke] jar not found: ${JAR_PATH}" >&2
  exit 1
fi

echo "[smoke] starting server on ${BASE_URL}"
nohup java -jar "${JAR_PATH}" --server.port="${PORT}" --captcha.enable=false >"${LOG_FILE}" 2>&1 &
SERVER_PID=$!

ready=0
for _ in $(seq 1 60); do
  if curl -fsS "${BASE_URL}/auth/code" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "${ready}" -ne 1 ]]; then
  echo "[smoke] server failed to become ready, log: ${LOG_FILE}" >&2
  sed -n '1,220p' "${LOG_FILE}" >&2 || true
  exit 1
fi

echo "[smoke] server is ready, running endpoint checks..."
BASE_URL="${BASE_URL}" \
ROLE_ID="${ROLE_ID}" \
DICT_TYPE="${DICT_TYPE}" \
CLIENT_ID="${CLIENT_ID}" \
USERNAME="${USERNAME}" \
PASSWORD="${PASSWORD}" \
LOGIN_CANDIDATES="${LOGIN_CANDIDATES}" \
RSA_PUBLIC_KEY="${RSA_PUBLIC_KEY}" \
node "${SCRIPT_DIR}/smoke_checks.mjs"

echo "[smoke] all checks passed."
echo "[smoke] server log file: ${LOG_FILE}"
if [[ "${KEEP_SERVER}" -eq 1 ]]; then
  echo "[smoke] keep-server enabled, pid=${SERVER_PID}"
fi
