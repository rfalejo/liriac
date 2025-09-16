from __future__ import annotations

import os
from datetime import UTC, datetime
from pathlib import Path

from ...domain.entities.suggestion import Suggestion
from ...domain.value_objects import ChapterRef


def merge_text(base: str, suggestion: str) -> str:
    """Append suggestion to base separated by exactly one blank line and trailing newline.

    Ensures the returned text ends with a single "\n" and there is exactly one
    blank line between the original base and the suggestion body.
    """
    base_stripped = base.rstrip("\n")
    suggestion_stripped = suggestion.strip("\n")
    merged = f"{base_stripped}\n\n{suggestion_stripped}\n"
    return merged


def _safe_stem(ref: ChapterRef) -> str:
    # Use only the file stem (no extension) and sanitize minimal characters
    stem = ref.relative_path.stem
    # Replace spaces or weird chars just in case
    safe = "".join(c for c in stem if c.isalnum() or c in ("-", "_")) or "chapter"
    return safe


def write_log(base_dir: Path, ref: ChapterRef, suggestion: Suggestion, now: datetime) -> Path:
    """Write a Markdown log entry for an accepted suggestion atomically.

    File path: <book>/.liriac/suggestions/YYYY-MM-DDTHH-MM-SSZ-<stem>.md
    Returns the final written path.
    """
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")

    # Construct directory and filename
    book_dir = base_dir / str(ref.book_id)
    target_dir = book_dir / ".liriac" / "suggestions"
    target_dir.mkdir(parents=True, exist_ok=True)

    ts = now.astimezone(UTC).strftime("%Y-%m-%dT%H-%M-%SZ")
    filename = f"{ts}-{_safe_stem(ref)}.md"
    final_path = target_dir / filename
    tmp_path = final_path.with_suffix(".tmp")

    # Compose content
    header = (
        f"---\n"
        f"timestamp: {ts}\n"
        f"source: {suggestion.source}\n"
        f"status: accepted\n"
        f"---\n\n"
    )
    body = suggestion.text.rstrip("\n") + "\n"
    content = header + body

    # Atomic write
    with open(tmp_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    os.replace(tmp_path, final_path)

    return final_path
