#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash .codex/skills/infoq-subagent-delivery/scripts/init_plan_dir.sh <task-slug>" >&2
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

task_slug="$1"
if [[ ! "$task_slug" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Task slug must use ASCII letters, digits, dots, underscores, or hyphens: $task_slug" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../../../../" && pwd)"
template_dir="$repo_root/doc/agents"
task_dir="$repo_root/doc/plan/$task_slug"

mkdir -p "$task_dir"

copy_template() {
  local template_name="$1"
  local target_name="$2"
  local source_path="$template_dir/$template_name"
  local target_path="$task_dir/$target_name"

  if [[ ! -f "$source_path" ]]; then
    echo "Missing template: $source_path" >&2
    exit 1
  fi

  if [[ -f "$target_path" ]]; then
    echo "Preserved existing file: $target_path"
  else
    cp "$source_path" "$target_path"
    echo "Created: $target_path"
  fi
}

copy_template "PRD.template.md" "PRD.md"
copy_template "DESIGN.template.md" "DESIGN.md"
copy_template "TRS.template.md" "TRS.md"
copy_template "MATERIAL.template.md" "MATERIAL.md"
copy_template "DELIVERY.template.md" "DELIVERY.md"

echo "Task directory ready: $task_dir"
