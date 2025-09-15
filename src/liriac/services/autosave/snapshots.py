"""Snapshot functionality for autosave service.

Handles writing full-content snapshots to version directories when
content changes exceed configured thresholds.
"""

from __future__ import annotations

import os
import tempfile
from datetime import datetime
from pathlib import Path

from ...domain.value_objects import ChapterRef


def write_snapshot(
    base_dir: Path, ref: ChapterRef, content: str, now: datetime
) -> Path:
    """Write a full-content snapshot file for a chapter.

    Args:
        base_dir: Base directory path (library path)
        ref: Chapter reference identifying the book and chapter
        content: Full chapter content to snapshot
        now: UTC timestamp for the snapshot

    Returns:
        Path to the created snapshot file

    Raises:
        OSError: If the snapshot file cannot be written
    """
    # Construct the versions directory path
    book_dir = base_dir / ref.book_id
    versions_dir = book_dir / ".liriac" / "versions"

    # Ensure the versions directory exists
    versions_dir.mkdir(parents=True, exist_ok=True)

    # Format timestamp for filename (UTC, filesystem-safe)
    # Format: YYYY-MM-DDTHH-MM-SSZ-<stem>.md
    timestamp_str = now.strftime("%Y-%m-%dT%H-%M-%SZ")
    chapter_stem = ref.relative_path.stem
    snapshot_filename = f"{timestamp_str}-{chapter_stem}.md"
    snapshot_path = versions_dir / snapshot_filename

    # Normalize content to ensure trailing newline
    normalized_content = content.rstrip("\n") + "\n"

    # Write atomically using temporary file in the same directory
    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=versions_dir,
        delete=False,
        suffix=".tmp",
    ) as tmp_file:
        tmp_file.write(normalized_content)
        tmp_path = Path(tmp_file.name)

    # Atomic replace
    os.replace(tmp_path, snapshot_path)

    return snapshot_path


__all__ = [
    "write_snapshot",
]
