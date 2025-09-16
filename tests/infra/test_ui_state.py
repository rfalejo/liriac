from __future__ import annotations

import json
import time
from pathlib import Path

from liriac.domain.types import BookId
from liriac.infra import UIState, load_ui_state, save_ui_state


def _state_path(root: Path, book: str) -> Path:
    return root / book / ".liriac" / "state.json"


def test_load_missing_returns_defaults(tmp_path: Path) -> None:
    book = BookId("test-book")
    # no files created
    state = load_ui_state(tmp_path, book)
    assert state.last_opened is None
    assert state.caret_offset is None
    # updated_at should be a non-empty ISO string
    assert isinstance(state.updated_at, str) and state.updated_at


def test_save_creates_state_with_trailing_newline(tmp_path: Path) -> None:
    book = BookId("book1")
    state = UIState(last_opened="chapters/01.md", caret_offset=None, updated_at="2024-01-01T00:00:00+00:00")
    path = save_ui_state(tmp_path, book, state)
    assert path == _state_path(tmp_path, "book1")
    assert path.exists()
    text = path.read_text(encoding="utf-8")
    assert text.endswith("\n")
    data = json.loads(text)
    assert data["last_opened"] == "chapters/01.md"
    assert data["caret_offset"] is None
    assert data["updated_at"] == "2024-01-01T00:00:00+00:00"


def test_atomic_write_and_updated_at_changes(tmp_path: Path) -> None:
    book = BookId("book2")
    path = _state_path(tmp_path, "book2")

    first = UIState(last_opened="chapters/01.md", caret_offset=10, updated_at="2024-01-01T00:00:00+00:00")
    save_ui_state(tmp_path, book, first)
    # ensure no temp files remain
    for p in path.parent.glob("*.tmp"):
        raise AssertionError(f"Temp file left behind: {p}")

    # second save with different timestamp
    time.sleep(0.01)
    second = UIState(last_opened="chapters/02.md", caret_offset=None, updated_at="2024-01-02T00:00:00+00:00")
    save_ui_state(tmp_path, book, second)
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    assert data["last_opened"] == "chapters/02.md"
    assert data["updated_at"] == "2024-01-02T00:00:00+00:00"


def test_corrupt_file_returns_defaults(tmp_path: Path) -> None:
    book_dir = tmp_path / "book3"
    liriac = book_dir / ".liriac"
    liriac.mkdir(parents=True)
    state_file = liriac / "state.json"
    state_file.write_text("{invalid json", encoding="utf-8")

    state = load_ui_state(tmp_path, BookId("book3"))
    assert state.last_opened is None
    assert state.caret_offset is None
    assert isinstance(state.updated_at, str) and state.updated_at
