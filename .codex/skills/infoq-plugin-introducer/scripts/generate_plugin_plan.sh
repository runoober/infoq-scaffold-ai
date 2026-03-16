#!/usr/bin/env bash

set -euo pipefail

PLUGIN_NAME=""
PLUGIN_CLASS=""
NEEDS_FRONTEND="auto"
OUT_FILE=""

usage() {
  cat <<'EOF'
Usage:
  generate_plugin_plan.sh --name <infoq-plugin-xxx> --class <fixed|reusable|toggle> [--frontend <yes|no|auto>] [--out <file>]

Examples:
  bash .codex/skills/infoq-plugin-introducer/scripts/generate_plugin_plan.sh \
    --name infoq-plugin-audit \
    --class reusable

  bash .codex/skills/infoq-plugin-introducer/scripts/generate_plugin_plan.sh \
    --name infoq-plugin-sse \
    --class toggle \
    --frontend yes \
    --out /tmp/plugin-plan.md
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      PLUGIN_NAME="${2:-}"
      shift 2
      ;;
    --class)
      PLUGIN_CLASS="${2:-}"
      shift 2
      ;;
    --frontend)
      NEEDS_FRONTEND="${2:-}"
      shift 2
      ;;
    --out)
      OUT_FILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "${PLUGIN_NAME}" || -z "${PLUGIN_CLASS}" ]]; then
  echo "Error: --name and --class are required." >&2
  usage >&2
  exit 1
fi

if [[ ! "${PLUGIN_CLASS}" =~ ^(fixed|reusable|toggle)$ ]]; then
  echo "Error: --class must be one of fixed|reusable|toggle." >&2
  exit 1
fi

if [[ ! "${NEEDS_FRONTEND}" =~ ^(yes|no|auto)$ ]]; then
  echo "Error: --frontend must be yes|no|auto." >&2
  exit 1
fi

render_class_note() {
  case "${PLUGIN_CLASS}" in
    fixed)
      cat <<'EOF'
- `fixed`：基座固定保留。目标是稳定接入，不做运行时开关。
EOF
      ;;
    reusable)
      cat <<'EOF'
- `reusable`：通用能力插件。目标是模块按需依赖，保持接口通用与低耦合。
EOF
      ;;
    toggle)
      cat <<'EOF'
- `toggle`：可配置软关闭插件。目标是保留依赖，默认 `enabled=false`，按配置启停。
EOF
      ;;
  esac
}

render_config_note() {
  case "${PLUGIN_CLASS}" in
    fixed)
      cat <<'EOF'
### 配置策略
- 不新增 `enabled` 开关（除非有明确运维要求）。
- 避免在业务模块硬编码插件内部实现细节。
EOF
      ;;
    reusable)
      cat <<'EOF'
### 配置策略
- 插件保持通用 API（注解/接口/facade）。
- 由业务模块在各自 `pom.xml` 按需引入，不强制全局启用。
EOF
      ;;
    toggle)
      cat <<'EOF'
### 配置策略
- 后端新增并默认关闭开关（示例：`xxx.enabled=false`）。
- 若涉及前端运行时行为，增加 `VITE_APP_XXX=false` 并做逻辑门控。
EOF
      ;;
  esac
}

render_frontend_note() {
  if [[ "${NEEDS_FRONTEND}" == "no" ]]; then
    cat <<'EOF'
### 前端联动
- 本次标记为不需要前端开关。
EOF
    return
  fi

  if [[ "${NEEDS_FRONTEND}" == "yes" ]]; then
    cat <<'EOF'
### 前端联动
- 需要补充前端环境变量：
  - `infoq-scaffold-frontend-vue/.env.development`
  - `infoq-scaffold-frontend-vue/.env.production`
- 在前端启动/请求链路中以 env 开关控制逻辑，关闭时走兼容分支。
EOF
    return
  fi

  cat <<'EOF'
### 前端联动
- `auto`：若插件涉及前端运行时通信或请求链路（如 encrypt/sse/websocket），则必须增加前端开关；否则可不加。
EOF
}

PLAN_CONTENT="$(cat <<EOF
# Plugin Onboarding Plan

## 输入
- 插件名：\`${PLUGIN_NAME}\`
- 分类：\`${PLUGIN_CLASS}\`
- 前端联动：\`${NEEDS_FRONTEND}\`

## 分类说明
$(render_class_note)

## 后端改动清单
1. 模块注册：
   - \`infoq-scaffold-backend/infoq-plugin/pom.xml\` 增加 \`${PLUGIN_NAME}\` module。
2. 版本管理：
   - \`infoq-scaffold-backend/infoq-core/infoq-core-bom/pom.xml\` 增加版本属性/依赖管理。
3. 消费模块依赖：
   - 目标模块（通常 \`infoq-scaffold-backend/infoq-modules/infoq-system/pom.xml\`）按需引入。
4. 代码耦合控制：
   - 通过注解/接口/facade 暴露能力，避免业务直接依赖插件内部实现。
5. 文档归档：
   - 更新 \`doc/plugin-catalog.md\`，标注插件分档与开关策略。

$(render_config_note)

$(render_frontend_note)

## 验证命令
优先使用 \`pnpm\`；如果当前环境没有 \`pnpm\`，则回退为等价的 \`npm\` 命令。
\`\`\`bash
cd infoq-scaffold-backend && mvn clean package -P dev -pl infoq-modules/infoq-system -am
cd infoq-scaffold-frontend-vue && pnpm run build:prod
\`\`\`

## 验收标准
1. 插件分档清晰（fixed/reusable/toggle）。
2. POM 改动最小且可回滚。
3. 若为 toggle，默认关闭且可一键开启。
4. 前后端开关（如有）成对提交。
5. 后端编译与前端构建通过。
EOF
)"

if [[ -n "${OUT_FILE}" ]]; then
  printf "%s\n" "${PLAN_CONTENT}" > "${OUT_FILE}"
  echo "Plan written to: ${OUT_FILE}"
else
  printf "%s\n" "${PLAN_CONTENT}"
fi
