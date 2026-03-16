#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/script/docker/docker-compose.yml"
REDIS_CONF_SOURCE="${REPO_ROOT}/script/docker/redis/conf/redis.conf"
SERVER_CONFIG_TEMPLATE="${REPO_ROOT}/script/docker/server/application-prod.yml"
SQL_INIT_FILE="${REPO_ROOT}/sql/infoq_scaffold_2.0.0.sql"
BACKEND_DIR="${REPO_ROOT}/infoq-scaffold-backend"
BACKEND_SERVICES=(mysql redis minio infoq-admin)
DEFAULT_DEPLOY_ROOT="/infoq"
DEPLOY_ROOT=""

usage() {
  cat <<'EOF'
用法: bash script/bin/infoq.sh {prepare|package|build-image|deploy|start|stop|restart|status|logs} [service]

命令说明:
  prepare      创建后端及依赖服务所需宿主机目录，并同步 redis.conf 与 application-prod.yml
  package      执行后端 prod 打包
  build-image  仅构建 infoq-admin 镜像
  deploy       prepare + package + 启动依赖服务 + 自动初始化数据库 + 启动 infoq-admin
  start        启动 mysql、redis、minio、infoq-admin
  stop         停止 mysql、redis、minio、infoq-admin
  restart      重启 infoq-admin
  status       查看后端相关服务状态
  logs         查看服务日志，默认 infoq-admin，可选 mysql|redis|minio|infoq-admin
EOF
}

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "[backend] 缺少命令: $name" >&2
    exit 1
  fi
}

compose() {
  INFOQ_DEPLOY_ROOT="${DEPLOY_ROOT}" docker compose -f "${COMPOSE_FILE}" "$@"
}

resolve_deploy_root() {
  if [[ -n "${INFOQ_DEPLOY_ROOT:-}" ]]; then
    DEPLOY_ROOT="${INFOQ_DEPLOY_ROOT}"
  elif [[ -d "${DEFAULT_DEPLOY_ROOT}" || -w "/" ]]; then
    DEPLOY_ROOT="${DEFAULT_DEPLOY_ROOT}"
  else
    DEPLOY_ROOT="${HOME}/infoq"
  fi
}

prepare_dirs() {
  local dirs=(
    "${DEPLOY_ROOT}/mysql/data"
    "${DEPLOY_ROOT}/mysql/conf"
    "${DEPLOY_ROOT}/redis/conf"
    "${DEPLOY_ROOT}/redis/data"
    "${DEPLOY_ROOT}/minio/data"
    "${DEPLOY_ROOT}/server/config"
    "${DEPLOY_ROOT}/server/logs"
    "${DEPLOY_ROOT}/server/temp"
  )

  for dir in "${dirs[@]}"; do
    mkdir -p "${dir}"
    chmod 777 "${dir}" || true
  done

  cp -f "${REDIS_CONF_SOURCE}" "${DEPLOY_ROOT}/redis/conf/redis.conf"

  if [[ ! -f "${DEPLOY_ROOT}/server/config/application-prod.yml" ]]; then
    cp -f "${SERVER_CONFIG_TEMPLATE}" "${DEPLOY_ROOT}/server/config/application-prod.yml"
    echo "[backend] 已初始化 ${DEPLOY_ROOT}/server/config/application-prod.yml"
  else
    echo "[backend] 保留现有 ${DEPLOY_ROOT}/server/config/application-prod.yml"
  fi

  echo "[backend] 使用部署根目录: ${DEPLOY_ROOT}"
  echo "[backend] 目录和配置已同步完成"
}

package_backend() {
  require_command mvn
  (
    cd "${BACKEND_DIR}"
    mvn clean package -P prod -pl infoq-admin -am
  )
}

build_image() {
  require_command docker
  compose build infoq-admin
}

wait_for_mysql() {
  local max_attempts=60
  local attempt=1

  echo "[backend] 等待 MySQL 就绪..."
  until compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot -proot --silent >/dev/null 2>&1; do
    if (( attempt >= max_attempts )); then
      echo "[backend] MySQL 启动超时" >&2
      exit 1
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
}

wait_for_redis() {
  local max_attempts=60
  local attempt=1

  echo "[backend] 等待 Redis 就绪..."
  until compose exec -T redis redis-cli -a 123456 ping 2>/dev/null | grep -q '^PONG$'; do
    if (( attempt >= max_attempts )); then
      echo "[backend] Redis 启动超时" >&2
      exit 1
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
}

ensure_database_initialized() {
  local table_count

  if [[ ! -f "${SQL_INIT_FILE}" ]]; then
    echo "[backend] 缺少 SQL 初始化文件: ${SQL_INIT_FILE}" >&2
    exit 1
  fi

  table_count="$(compose exec -T mysql mysql -uroot -proot -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='infoq' AND table_name='sys_oss_config';" 2>/dev/null | tr -d '\r')"

  if [[ "${table_count:-0}" == "1" ]]; then
    echo "[backend] 数据库已初始化，跳过 SQL 导入"
    return
  fi

  echo "[backend] 检测到 infoq 库未初始化，开始导入 ${SQL_INIT_FILE##${REPO_ROOT}/}"
  compose exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS infoq CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
  compose exec -T mysql mysql -uroot -proot infoq < "${SQL_INIT_FILE}"
  echo "[backend] 数据库初始化完成"
}

start_dependencies() {
  compose up -d mysql redis minio
  wait_for_mysql
  wait_for_redis
  ensure_database_initialized
}

deploy_backend() {
  require_command docker
  prepare_dirs
  package_backend
  start_dependencies
  compose up -d --build infoq-admin
  echo "[backend] 部署完成，访问端口: 9090"
}

start_backend() {
  require_command docker
  prepare_dirs
  start_dependencies
  compose up -d infoq-admin
  echo "[backend] 服务已启动，访问端口: 9090"
}

stop_backend() {
  require_command docker
  compose stop "${BACKEND_SERVICES[@]}"
}

restart_backend() {
  require_command docker
  compose restart infoq-admin
}

status_backend() {
  require_command docker
  compose ps "${BACKEND_SERVICES[@]}"
}

show_logs() {
  require_command docker
  local service="${1:-infoq-admin}"
  compose logs -f "${service}"
}

case "${1:-}" in
  prepare)
    resolve_deploy_root
    prepare_dirs
    ;;
  package)
    package_backend
    ;;
  build-image)
    resolve_deploy_root
    build_image
    ;;
  deploy)
    resolve_deploy_root
    deploy_backend
    ;;
  start)
    resolve_deploy_root
    start_backend
    ;;
  stop)
    resolve_deploy_root
    stop_backend
    ;;
  restart)
    resolve_deploy_root
    restart_backend
    ;;
  status)
    resolve_deploy_root
    status_backend
    ;;
  logs)
    resolve_deploy_root
    show_logs "${2:-infoq-admin}"
    ;;
  *)
    usage
    exit 1
    ;;
esac
