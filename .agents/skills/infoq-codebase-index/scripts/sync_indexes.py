#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
SKILL_DIR = Path(__file__).resolve().parents[1]
AGENTS_PATH = ROOT / "AGENTS.md"

LOCAL_SKILL = "infoq-codebase-index"
SKILL_TRIGGER_CLAUSE = (
    "Use infoq-codebase-index when requests mention 查类名/找类/找文件/目录索引/文件索引/"
    "组件在哪 or involve locating classes, components, pages, APIs, mappers, services, or "
    "routes across infoq-scaffold-backend, infoq-scaffold-frontend-react, and "
    "infoq-scaffold-frontend-vue, or when edits add/delete/rename/move files or class names "
    "in those workspaces so the index skill is refreshed before finishing."
)
INDEX_SKILL_LINE = (
    "|Code Index Skill:.agents/skills/infoq-codebase-index:{SKILL.md,scripts/sync_indexes.py,"
    "references/usage.md,references/backend-index.md,references/frontend-react-index.md,"
    "references/frontend-vue-index.md}"
)
INDEX_REFRESH_LINE = (
    "|Code Index Refresh:Run python3 .agents/skills/infoq-codebase-index/scripts/sync_indexes.py "
    "after add/delete/rename/move/class-name change in infoq-scaffold-backend, "
    "infoq-scaffold-frontend-react, or infoq-scaffold-frontend-vue so the skill references and "
    "AGENTS routing stay current."
)

TARGETS = (
    {
        "repo": "infoq-scaffold-backend",
        "output": SKILL_DIR / "references" / "backend-index.md",
        "title": "# infoq-scaffold-backend index",
        "hint": "Read this file only when the task targets backend file or class lookup.",
        "usage": "Load this file only when you need deterministic backend file lookup across `infoq-scaffold-backend`.",
    },
    {
        "repo": "infoq-scaffold-frontend-react",
        "output": SKILL_DIR / "references" / "frontend-react-index.md",
        "title": "# infoq-scaffold-frontend-react index",
        "hint": "Read this file only when the task targets React file, component, or route lookup.",
        "usage": "Load this file only when you need deterministic React admin file, component, or route lookup across `infoq-scaffold-frontend-react`.",
    },
    {
        "repo": "infoq-scaffold-frontend-vue",
        "output": SKILL_DIR / "references" / "frontend-vue-index.md",
        "title": "# infoq-scaffold-frontend-vue index",
        "hint": "Read this file only when the task targets Vue file, component, or route lookup.",
        "usage": "Load this file only when you need deterministic Vue admin file, component, or route lookup across `infoq-scaffold-frontend-vue`.",
    },
)


def run_git_ls_files(repo: str) -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(ROOT / repo), "ls-files"],
        check=True,
        capture_output=True,
        text=True,
    )
    return [f"{repo}/{line}" for line in result.stdout.splitlines() if line.strip()]


def build_reference_content(target: dict[str, Path | str]) -> str:
    repo = str(target["repo"])
    title = str(target["title"])
    hint = str(target["hint"])
    usage = str(target["usage"])
    paths = run_git_ls_files(repo)
    return (
        "\n".join(
            [
                title,
                hint,
                "",
                "## Table of contents",
                "",
                "- [Usage](#usage)",
                "- [Path index](#path-index)",
                "",
                "## Usage",
                "",
                usage,
                "",
                "## Path index",
                "",
                *paths,
            ]
        )
        + "\n"
    )


def write_reference(target: dict[str, Path | str]) -> None:
    output = Path(target["output"])
    content = build_reference_content(target)
    output.write_text(content, encoding="utf-8")


def ensure_local_skill(line: str) -> str:
    prefix = "|Local Skills:.agents/skills:{"
    suffix = "}"
    if not line.startswith(prefix) or not line.endswith(suffix):
        return line
    names = [part for part in line[len(prefix) : -len(suffix)].split(",") if part]
    if LOCAL_SKILL not in names:
        names.append(LOCAL_SKILL)
    return prefix + ",".join(names) + suffix


def ensure_trigger_clause(line: str) -> str:
    if not line.startswith("|Skill Trigger:"):
        return line
    if SKILL_TRIGGER_CLAUSE in line:
        return line
    return f"{line}|{SKILL_TRIGGER_CLAUSE}"


def build_agents_content() -> str:
    lines = AGENTS_PATH.read_text(encoding="utf-8").splitlines()
    normalized: list[str] = []
    for line in lines:
        if line.startswith("|Code Index Docs:") or line.startswith("|Index Usage:"):
            continue
        if line.startswith("|Local Skills:"):
            line = ensure_local_skill(line)
        if line.startswith("|Skill Trigger:"):
            line = ensure_trigger_clause(line)
        normalized.append(line)

    if INDEX_SKILL_LINE not in normalized:
        insert_after = "|Element Plus Skill:"
        for idx, line in enumerate(normalized):
            if line.startswith(insert_after):
                normalized.insert(idx + 1, INDEX_SKILL_LINE)
                break
        else:
            normalized.insert(1, INDEX_SKILL_LINE)

    if INDEX_REFRESH_LINE not in normalized:
        insert_after = INDEX_SKILL_LINE
        for idx, line in enumerate(normalized):
            if line == insert_after:
                normalized.insert(idx + 1, INDEX_REFRESH_LINE)
                break
        else:
            normalized.append(INDEX_REFRESH_LINE)

    return "\n".join(normalized) + "\n"


def update_agents() -> None:
    AGENTS_PATH.write_text(build_agents_content(), encoding="utf-8")


def check_synced() -> int:
    stale: list[str] = []
    for target in TARGETS:
        output = Path(target["output"])
        expected = build_reference_content(target)
        actual = output.read_text(encoding="utf-8") if output.exists() else ""
        if actual != expected:
            stale.append(str(output.relative_to(ROOT)))

    expected_agents = build_agents_content()
    actual_agents = AGENTS_PATH.read_text(encoding="utf-8")
    if actual_agents != expected_agents:
        stale.append(str(AGENTS_PATH.relative_to(ROOT)))

    if stale:
        print("Codebase index is stale:")
        for path in stale:
            print(f"- {path}")
        return 1

    print("Codebase index references and AGENTS.md are up to date")
    return 0


def main() -> None:
    if len(sys.argv) > 2 or (len(sys.argv) == 2 and sys.argv[1] != "--check"):
        print("Usage: python3 sync_indexes.py [--check]", file=sys.stderr)
        raise SystemExit(2)
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        raise SystemExit(check_synced())

    for target in TARGETS:
        write_reference(target)
    update_agents()
    print("Synced infoq-codebase-index references and AGENTS.md")


if __name__ == "__main__":
    main()
