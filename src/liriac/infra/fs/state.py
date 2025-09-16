"""UI state persistence adapter.

Stores and retrieves minimal UI state for a book under `.liriac/state.json`.
Implements tolerant reads (returning defaults on errors) and atomic writes.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from typing import Final

from ...domain.types import BookId


@dataclass(frozen=True)
class UIState:
    """Minimal UI state for a book.

    - last_opened: relative POSIX path (e.g., "chapters/01.md") or None
    - caret_offset: optional integer caret position within the chapter
    - updated_at: ISO 8601 UTC timestamp string
    """

    last_opened: str | None
    caret_offset: int | None
    updated_at: str


_LIRIAC_DIR: Final[str] = ".liriac"
_STATE_FILE_NAME: Final[str] = "state.json"


def _now_iso_utc() -> str:
    return datetime.now(tz=UTC).isoformat()


def _state_file_path(library_path: Path, book_id: BookId) -> Path:
    return library_path / book_id / _LIRIAC_DIR / _STATE_FILE_NAME


def _normalize_relative_posix(path_str: object) -> str | None:
    """Validate and normalize a user-provided relative POSIX path string.

    Returns the normalized string if valid, otherwise None.
    """
    if not isinstance(path_str, str) or not path_str:
        return None
    try:
        p = PurePosixPath(path_str)
    except Exception:
        return None
    # must be relative
    if p.is_absolute():
        return None
    # no up-level references
    if ".." in p.parts:
        return None
    # normalize using PurePosixPath.as_posix()
    return p.as_posix()


def load_ui_state(library_path: Path, book_id: BookId) -> UIState:
    """Load UI state for a given book.

    - Missing or invalid files return defaults (no exception).
    - last_opened is validated to be a relative POSIX path.
    """
    path = _state_file_path(library_path, book_id)
    # Defaults
    default_state = UIState(last_opened=None, caret_offset=None, updated_at=_now_iso_utc())

    try:
        data: dict[str, object]
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        last_opened = _normalize_relative_posix(data.get("last_opened")) if isinstance(data, dict) else None
        caret_offset_obj = data.get("caret_offset") if isinstance(data, dict) else None
        caret_offset = int(caret_offset_obj) if isinstance(caret_offset_obj, int) else None
        updated_at_obj = data.get("updated_at") if isinstance(data, dict) else None
        updated_at = updated_at_obj if isinstance(updated_at_obj, str) and updated_at_obj else _now_iso_utc()
        return UIState(last_opened=last_opened, caret_offset=caret_offset, updated_at=updated_at)
    except Exception:
        # Any error -> return defaults
        return default_state


def save_ui_state(library_path: Path, book_id: BookId, state: UIState) -> Path:
    """Persist UI state atomically and return the final file path.

    Ensures `.liriac/` exists. Writes UTF-8 with a trailing newline.
    """
    state_dir = (library_path / book_id / _LIRIAC_DIR)
    state_dir.mkdir(parents=True, exist_ok=True)
    final_path = state_dir / _STATE_FILE_NAME

    # build JSON payload (ensure validation of last_opened again)
    payload = {
        "last_opened": _normalize_relative_posix(state.last_opened) if state.last_opened is not None else None,
        "caret_offset": state.caret_offset if isinstance(state.caret_offset, int) else None,
        "updated_at": state.updated_at or _now_iso_utc(),
    }
    text = json.dumps(payload, ensure_ascii=False) + "\n"

    # write atomically to a temp file in the same directory
    tmp_path = final_path.with_suffix(".json.tmp")
    try:
        with tmp_path.open("w", encoding="utf-8") as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, final_path)
    except Exception as e:
        # attempt cleanup if temp remains
        try:
            if tmp_path.exists():
                tmp_path.unlink()
        except OSError:
            pass
        raise OSError(f"Failed to write UI state: {e}") from e

    return final_path


__all__ = [
    "UIState",
    "load_ui_state",
    "save_ui_state",
]
