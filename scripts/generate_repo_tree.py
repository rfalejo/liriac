#!/usr/bin/env python3
"""Print an ASCII tree of tracked files and refresh the instructions snapshot."""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple

ChildMap = Dict[Path, Dict[str, Set[str]]]


def resolve_repo_root(provided: str | None) -> Path:
    if provided:
        return Path(provided).resolve()
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit("Unable to locate the repository root. Is this a Git repo?")
    return Path(result.stdout.strip())


def tracked_paths(root: Path) -> List[Path]:
    result = subprocess.run(
        ["git", "ls-files"],
        capture_output=True,
        text=True,
        check=False,
        cwd=root,
    )
    if result.returncode != 0:
        raise SystemExit("Unable to list tracked files with git ls-files.")
    paths = [Path(line.strip()) for line in result.stdout.splitlines() if line.strip()]
    if not paths:
        raise SystemExit("No tracked files found. Nothing to render.")
    return paths


def build_children(files: List[Path]) -> ChildMap:
    children: ChildMap = defaultdict(lambda: {"dirs": set(), "files": set()})
    root = Path(".")
    children[root]
    for file_path in files:
        parent = file_path.parent if str(file_path.parent) != "" else root
        children[parent]["files"].add(file_path.name)
        for directory in file_path.parents:
            if directory == root:
                continue
            parent_dir = directory.parent if str(directory.parent) != "" else root
            children[parent_dir]["dirs"].add(directory.name)
            children[directory]
    return children


def render_directory(
    children: ChildMap, current: Path, prefix: str, lines: List[str]
) -> None:
    dirs = sorted(children[current]["dirs"])
    files = sorted(children[current]["files"])
    entries: List[Tuple[str, str]] = [("dir", name) for name in dirs]
    entries.extend(("file", name) for name in files)
    for index, (kind, name) in enumerate(entries):
        is_last = index == len(entries) - 1
        connector = "\\-- " if is_last else "|-- "
        line = f"{prefix}{connector}{name}{'/' if kind == 'dir' else ''}"
        lines.append(line)
        if kind == "dir":
            next_prefix = f"{prefix}    " if is_last else f"{prefix}|   "
            render_directory(children, current / name, next_prefix, lines)


def render_tree(children: ChildMap) -> List[str]:
    root = Path(".")
    dirs = sorted(children[root]["dirs"])
    files = sorted(children[root]["files"])
    lines: List[str] = []
    for directory in dirs:
        lines.append(f"{directory}/")
        render_directory(children, Path(directory), "", lines)
    for file_name in files:
        lines.append(file_name)
    return lines


def update_instructions(
    repo_root: Path, lines: List[str], override_path: str | None
) -> None:
    instructions_path = Path(override_path) if override_path else Path(
        ".github/instructions/copilot-instructions.md"
    )
    if not instructions_path.is_absolute():
        instructions_path = (repo_root / instructions_path).resolve()
    if not instructions_path.exists():
        print(
            f"Instructions file not found at {instructions_path}; skipping update.",
            file=sys.stderr,
        )
        return
    content = instructions_path.read_text(encoding="utf-8")
    section_pattern = re.compile(
        r"## Repository layout snapshot\s*\n```[\s\S]*?```",
        re.MULTILINE,
    )
    if not section_pattern.search(content):
        print(
            "Could not locate the 'Repository layout snapshot' section; skipping update.",
            file=sys.stderr,
        )
        return
    tree_block = "\n".join(lines)
    replacement = (
        "## Repository layout snapshot\n\n```\n"
        + tree_block
        + "\n```"
    )
    updated = section_pattern.sub(replacement, content, count=1)
    instructions_path.write_text(updated, encoding="utf-8")
    print(f"Updated instructions file at {instructions_path}.", file=sys.stderr)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render an ASCII repository layout using tracked files.",
    )
    parser.add_argument(
        "--root",
        help="Path to the repository root. Defaults to the current Git root.",
    )
    parser.add_argument(
        "--instructions-path",
        help=(
            "Override the path to the instructions markdown to patch. "
            "Defaults to .github/instructions/copilot-instructions.md."
        ),
    )
    parser.add_argument(
        "--skip-instructions",
        action="store_true",
        help="Skip updating the instructions file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    repo_root = resolve_repo_root(args.root)
    files = tracked_paths(repo_root)
    children = build_children(files)
    tree_lines = render_tree(children)
    for line in tree_lines:
        print(line)
    if not args.skip_instructions:
        update_instructions(repo_root, tree_lines, args.instructions_path)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)