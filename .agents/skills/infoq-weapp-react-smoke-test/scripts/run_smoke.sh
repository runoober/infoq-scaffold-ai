#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
WEAPP_DIR="${REPO_ROOT}/infoq-scaffold-frontend-weapp-react"

SUITE="${WEAPP_SMOKE_SUITE:-full}"
BUILD_FIRST=1
AUTO_LOGIN="${WEAPP_E2E_AUTO_LOGIN:-true}"
KEEP_EXISTING_SESSION="${WEAPP_E2E_KEEP_EXISTING_SESSION:-false}"
URL_CHECK="${WECHAT_DEVTOOLS_URL_CHECK:-false}"
FAIL_ON_CONSOLE_ERROR="${WEAPP_E2E_FAIL_ON_CONSOLE_ERROR:-true}"
REPORT_MODE=""
LOGIN_HOME_ONLY=0

WECHAT_DEVTOOLS_CLI_PATH="${WECHAT_DEVTOOLS_CLI:-}"
TOKEN="${WEAPP_E2E_TOKEN:-}"
AUTO_LOGIN_USERNAME="${WEAPP_E2E_AUTO_LOGIN_USERNAME:-}"
AUTO_LOGIN_PASSWORD="${WEAPP_E2E_AUTO_LOGIN_PASSWORD:-}"
AUTO_LOGIN_CANDIDATES="${WEAPP_E2E_AUTO_LOGIN_CANDIDATES:-}"
AUTO_LOGIN_BASE_URL="${WEAPP_E2E_BASE_URL:-}"
HEALTH_URL="${WEAPP_SMOKE_HEALTH_URL:-}"

usage() {
  cat <<'EOF'
Usage: run_smoke.sh [options]

Options:
  --suite <smoke|core|full>    Smoke suite. Default: full.
  --skip-build                 Skip build:weapp:dev before smoke run.
  --url-check                  Enable WeChat legal-domain checks.
  --no-url-check               Disable WeChat legal-domain checks (default).
  --auto-login                 Enable backend auto-login (default).
  --no-auto-login              Disable auto-login (runner validates unauth redirects if no token/session).
  --keep-existing-session      Keep current mini-program local token/session.
  --token <token>              Use explicit token injection.
  --username <name>            Preferred auto-login username.
  --password <pwd>             Preferred auto-login password.
  --login-candidates <list>    Fallback list, e.g. "admin:admin123,dept:666666".
  --base-url <url>             Auto-login backend URL override.
  --health-url <url>           Backend health probe base URL (default: --base-url or http://127.0.0.1:8080).
  --cli <path>                 WeChat DevTools CLI absolute path.
  --report                     Force runner report output.
  --no-report                  Disable explicit report flag (full suite still reports by default).
  --login-home-only            Verify login-success -> home route pass for smoke mode, tolerate known login-route redirect mismatch.
  -h, --help                   Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --suite)
      SUITE="$2"
      shift 2
      ;;
    --skip-build)
      BUILD_FIRST=0
      shift
      ;;
    --url-check)
      URL_CHECK="true"
      shift
      ;;
    --no-url-check)
      URL_CHECK="false"
      shift
      ;;
    --auto-login)
      AUTO_LOGIN="true"
      shift
      ;;
    --no-auto-login)
      AUTO_LOGIN="false"
      shift
      ;;
    --keep-existing-session)
      KEEP_EXISTING_SESSION="true"
      shift
      ;;
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --username)
      AUTO_LOGIN_USERNAME="$2"
      shift 2
      ;;
    --password)
      AUTO_LOGIN_PASSWORD="$2"
      shift 2
      ;;
    --login-candidates)
      AUTO_LOGIN_CANDIDATES="$2"
      shift 2
      ;;
    --base-url)
      AUTO_LOGIN_BASE_URL="$2"
      shift 2
      ;;
    --health-url)
      HEALTH_URL="$2"
      shift 2
      ;;
    --cli)
      WECHAT_DEVTOOLS_CLI_PATH="$2"
      shift 2
      ;;
    --report)
      REPORT_MODE="--report"
      shift
      ;;
    --no-report)
      REPORT_MODE="--no-report"
      shift
      ;;
    --login-home-only)
      LOGIN_HOME_ONLY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[weapp-smoke] Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

case "${SUITE}" in
  smoke|core|full)
    ;;
  *)
    echo "[weapp-smoke] Invalid suite: ${SUITE}. Supported: smoke|core|full" >&2
    exit 1
    ;;
esac

if [[ ! -d "${WEAPP_DIR}" ]]; then
  echo "[weapp-smoke] Workspace not found: ${WEAPP_DIR}" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[weapp-smoke] node is required but not found in PATH" >&2
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  PKG="pnpm"
elif command -v npm >/dev/null 2>&1; then
  PKG="npm"
else
  echo "[weapp-smoke] pnpm/npm is required but not found in PATH" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "[weapp-smoke] curl is required but not found in PATH" >&2
  exit 1
fi

if [[ "${LOGIN_HOME_ONLY}" -eq 1 ]]; then
  SUITE="smoke"
  echo "[weapp-smoke] login-home-only mode enabled; force suite=smoke."
fi

run_script() {
  local script_name="$1"
  if [[ "${PKG}" == "pnpm" ]]; then
    (cd "${WEAPP_DIR}" && pnpm run "${script_name}")
    return
  fi
  (cd "${WEAPP_DIR}" && npm run "${script_name}")
}

if [[ "${BUILD_FIRST}" -eq 1 ]]; then
  echo "[weapp-smoke] Building dist with ${PKG} run build:weapp:dev ..."
  run_script "build:weapp:dev"
fi

echo "[weapp-smoke] Launching suite=${SUITE}, autoLogin=${AUTO_LOGIN}, keepExistingSession=${KEEP_EXISTING_SESSION}, urlCheck=${URL_CHECK}"

export WECHAT_DEVTOOLS_URL_CHECK="${URL_CHECK}"
export WEAPP_E2E_AUTO_LOGIN="${AUTO_LOGIN}"
export WEAPP_E2E_KEEP_EXISTING_SESSION="${KEEP_EXISTING_SESSION}"
export WEAPP_E2E_FAIL_ON_CONSOLE_ERROR="${FAIL_ON_CONSOLE_ERROR}"

if [[ -n "${WECHAT_DEVTOOLS_CLI_PATH}" ]]; then
  export WECHAT_DEVTOOLS_CLI="${WECHAT_DEVTOOLS_CLI_PATH}"
fi
if [[ -n "${TOKEN}" ]]; then
  export WEAPP_E2E_TOKEN="${TOKEN}"
fi
if [[ -n "${AUTO_LOGIN_USERNAME}" ]]; then
  export WEAPP_E2E_AUTO_LOGIN_USERNAME="${AUTO_LOGIN_USERNAME}"
fi
if [[ -n "${AUTO_LOGIN_PASSWORD}" ]]; then
  export WEAPP_E2E_AUTO_LOGIN_PASSWORD="${AUTO_LOGIN_PASSWORD}"
fi
if [[ -n "${AUTO_LOGIN_CANDIDATES}" ]]; then
  export WEAPP_E2E_AUTO_LOGIN_CANDIDATES="${AUTO_LOGIN_CANDIDATES}"
fi
if [[ -n "${AUTO_LOGIN_BASE_URL}" ]]; then
  export WEAPP_E2E_BASE_URL="${AUTO_LOGIN_BASE_URL}"
fi

resolve_health_url() {
  if [[ -n "${HEALTH_URL}" ]]; then
    echo "${HEALTH_URL}"
    return
  fi
  if [[ -n "${AUTO_LOGIN_BASE_URL}" ]]; then
    echo "${AUTO_LOGIN_BASE_URL}"
    return
  fi
  echo "http://127.0.0.1:8080"
}

verify_backend_health() {
  local probe_base_url="$1"
  local probe_endpoint="${probe_base_url%/}/auth/code"
  local probe_output="/tmp/weapp-smoke-auth-code.json"

  if ! curl -fsS --max-time 5 "${probe_endpoint}" >"${probe_output}"; then
    echo "[weapp-smoke] Backend health probe failed: ${probe_endpoint}" >&2
    echo "[weapp-smoke] Make sure backend is running and reachable before weapp smoke." >&2
    return 1
  fi

  if grep -Fq '"captchaEnabled":true' "${probe_output}"; then
    echo "[weapp-smoke] Backend health probe returned captchaEnabled=true at ${probe_endpoint}" >&2
    echo "[weapp-smoke] For smoke login, start backend with --captcha.enable=false." >&2
    return 1
  fi

  echo "[weapp-smoke] Backend health probe passed: ${probe_endpoint}"
}

should_probe_backend=0
if [[ "${AUTO_LOGIN}" == "true" || "${LOGIN_HOME_ONLY}" -eq 1 ]]; then
  should_probe_backend=1
fi

if [[ "${should_probe_backend}" -eq 1 ]]; then
  probe_base_url="$(resolve_health_url)"
  verify_backend_health "${probe_base_url}"
fi

RUNNER_ARGS=(--suite "${SUITE}")
if [[ -n "${REPORT_MODE}" ]]; then
  RUNNER_ARGS+=("${REPORT_MODE}")
fi

RUN_LOG_FILE="${WEAPP_SMOKE_RUN_LOG:-/tmp/weapp-smoke-run-$(date +%Y%m%d-%H%M%S).log}"

set +e
(
  cd "${WEAPP_DIR}"
  node ./tests/e2e/weapp/runner.mjs "${RUNNER_ARGS[@]}"
) 2>&1 | tee "${RUN_LOG_FILE}"
RUN_EXIT=${PIPESTATUS[0]}
set -e

if grep -Fq "[object Object]" "${RUN_LOG_FILE}"; then
  echo "[weapp-smoke] Detected \"[object Object]\" in runner log, which violates mini-program error-message contract." >&2
  echo "[weapp-smoke] Please normalize request failures in src/api/request.ts (errMsg/message/msg extraction + fallback)." >&2
  echo "[weapp-smoke] Runner log: ${RUN_LOG_FILE}" >&2
  exit 1
fi

if [[ "${LOGIN_HOME_ONLY}" -eq 1 ]]; then
  home_route_pass=0
  auth_injected=0
  known_login_redirect_mismatch=0

  if grep -Fq "[PASSED] smoke.routes :: route:/pages/home/index" "${RUN_LOG_FILE}"; then
    home_route_pass=1
  fi
  if grep -Fq "Auto login succeeded:" "${RUN_LOG_FILE}" \
    || grep -Fq "Injected Admin-Token from WEAPP_E2E_TOKEN." "${RUN_LOG_FILE}" \
    || grep -Fq "Using existing mini-program session token (WEAPP_E2E_KEEP_EXISTING_SESSION enabled)." "${RUN_LOG_FILE}"; then
    auth_injected=1
  fi
  if grep -Fq "[FAILED] smoke.routes :: route:/pages/login/index" "${RUN_LOG_FILE}"; then
    known_login_redirect_mismatch=1
  fi

  if [[ "${home_route_pass}" -eq 1 && "${auth_injected}" -eq 1 ]]; then
    if [[ "${RUN_EXIT}" -eq 0 ]]; then
      echo "[weapp-smoke] login-home-only passed."
      echo "[weapp-smoke] Runner log: ${RUN_LOG_FILE}"
      exit 0
    fi
    if [[ "${known_login_redirect_mismatch}" -eq 1 ]]; then
      echo "[weapp-smoke] login-home-only passed with known mismatch: authenticated /pages/login/index redirects to /pages/home/index."
      echo "[weapp-smoke] Runner log: ${RUN_LOG_FILE}"
      exit 0
    fi
  fi

  echo "[weapp-smoke] login-home-only failed." >&2
  echo "[weapp-smoke] Runner log: ${RUN_LOG_FILE}" >&2
  exit 1
fi

if [[ "${RUN_EXIT}" -ne 0 ]]; then
  echo "[weapp-smoke] Smoke suite failed. Runner log: ${RUN_LOG_FILE}" >&2
  exit "${RUN_EXIT}"
fi

echo "[weapp-smoke] Smoke suite passed."
echo "[weapp-smoke] Runner log: ${RUN_LOG_FILE}"
