from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path, PurePosixPath

import pytest
from textual.widgets import ListView

from liriac.app import LiriacApp
from liriac.domain.types import BookId
from liriac.domain.value_objects import ChapterRef
from liriac.infra import UIState, save_ui_state
from liriac.tui.screens.home.view import ChapterChosen, HomeScreen


@pytest.fixture
def simple_library(tmp_path: Path) -> Path:
    # create one book with two chapters
    book = tmp_path / "bookx"
    chapters = book / "chapters"
    chapters.mkdir(parents=True)
    (chapters / "01-a.md").write_text("A", encoding="utf-8")
    (chapters / "02-b.md").write_text("B", encoding="utf-8")
    (book / "book.toml").write_text(
        """
title = "Book X"
created_at = "2024-01-01T00:00:00+00:00"
chapters = ["chapters/01-a.md", "chapters/02-b.md"]
""",
        encoding="utf-8",
    )
    return tmp_path


async def test_state_written_on_chapter_chosen(simple_library: Path) -> None:
    ref = ChapterRef(BookId("bookx"), relative_path=PurePosixPath("chapters/02-b.md"))
    async with LiriacApp(simple_library).run_test() as pilot:
        await pilot.pause()
        home = pilot.app.screen
        assert isinstance(home, HomeScreen)
        home.post_message(ChapterChosen(BookId("bookx"), ref))
        await pilot.pause()

    # check file exists
    state_path = simple_library / "bookx" / ".liriac" / "state.json"
    assert state_path.exists()
    txt = state_path.read_text(encoding="utf-8")
    assert '"last_opened": "chapters/02-b.md"' in txt


async def test_pre_highlight_on_reload(simple_library: Path) -> None:
    # First, write the state by selecting a chapter
    ui = UIState(last_opened="chapters/01-a.md", caret_offset=None, updated_at=datetime.now(tz=UTC).isoformat())
    save_ui_state(simple_library, BookId("bookx"), ui)

    async with LiriacApp(simple_library).run_test() as pilot:
        await pilot.pause()
        home = pilot.app.screen
        assert isinstance(home, HomeScreen)
        # trigger chapters load for this book
        home._load_chapters(BookId("bookx"))
        await pilot.pause()
        chapters_list = pilot.app.screen.query_one("#chapters-list", ListView)
        # The highlighted index should be 0 (first chapter)
        assert chapters_list.index == 0
