#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: bash .agents/skills/infoq-openspec-delivery/scripts/init_change_dir.sh <change-id>" >&2
  exit 1
fi

change_id="$1"
change_dir="openspec/changes/${change_id}"
spec_dir="${change_dir}/specs"

mkdir -p "${spec_dir}"

create_if_missing() {
  local target="$1"
  local content="$2"

  if [ -f "${target}" ]; then
    return 0
  fi

  printf "%s" "${content}" > "${target}"
}

create_if_missing "${change_dir}/proposal.md" "# Proposal: ${change_id}

## Why

## What Changes

### Scope

### Non-Goals

## Acceptance Contract

- Functional scope:
- Non-goals:
- Exception handling and blockers:
- Required verification evidence:
- Rollback trigger or rollback conditions:

## Risks And Open Questions
"

create_if_missing "${change_dir}/tasks.md" "# Tasks: ${change_id}

## Backend

- [ ] Assess backend impact

## React

- [ ] Assess React impact

## Vue

- [ ] Assess Vue impact

## Verification

- [ ] Define main-flow verification
- [ ] Define targeted tests
- [ ] Define lint/build checks
- [ ] Record residual risks or blockers
"

echo "Initialized ${change_dir}"
