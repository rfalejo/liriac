"""Integration tests for chapter selection and editor opening.

Tests the complete flow from home screen chapter selection to editor opening.
"""

from __future__ import annotations

import tempfile
from collections.abc import Generator
from pathlib import Path

import pytest

from liriac.app import LiriacApp
from liriac.domain.types import BookId
from liriac.domain.value_objects import ChapterRef
from liriac.tui.screens.editor.view import EditorScreen
from liriac.tui.screens.home.view import ChapterChosen, HomeScreen


@pytest.fixture
def temp_library() -> Generator[Path, None, None]:
    """Create a temporary library with a test book and chapter."""
    with tempfile.TemporaryDirectory() as temp_dir:
        library_path = Path(temp_dir)

        # Create test book directory
        book_path = library_path / "test-book"
        book_path.mkdir()

        # Create book.toml
        book_toml = book_path / "book.toml"
        book_toml.write_text(
            """title = "Test Book"
created_at = "2024-01-01"
chapters = ["chapters/01-intro.md", "chapters/02-middle.md"]
"""
        )

        # Create chapters directory
        chapters_dir = book_path / "chapters"
        chapters_dir.mkdir()

        # Create chapter files
        (chapters_dir / "01-intro.md").write_text(
            "# Introduction\n\nThis is the introduction chapter.\n"
        )
        (chapters_dir / "02-middle.md").write_text(
            "# Chapter 2\n\nThis is the second chapter.\n"
        )

        yield library_path


class TestChapterSelectionIntegration:
    """Integration tests for chapter selection and editor opening."""

    @pytest.mark.asyncio
    async def test_chapter_selection_opens_editor_via_message(
        self, temp_library: Path
    ) -> None:
        """Test that posting a ChapterChosen message opens the editor."""
        app = LiriacApp(temp_library)

        async with app.run_test() as pilot:
            await pilot.pause()

            # Verify we start with home screen
            home_screen = pilot.app.screen
            assert isinstance(home_screen, HomeScreen)
            initial_screen_count = len(pilot.app.screen_stack)

            # Create a chapter reference manually
            from pathlib import PurePosixPath

            ref = ChapterRef(
                book_id=BookId("test-book"),
                relative_path=PurePosixPath("chapters/01-intro.md"),
            )

            # Post the ChapterChosen message directly
            chapter_chosen_msg = ChapterChosen(book_id=BookId("test-book"), ref=ref)
            pilot.app.post_message(chapter_chosen_msg)
            await pilot.pause()

            # Should have pushed editor screen
            assert len(pilot.app.screen_stack) == initial_screen_count + 1

            # Current screen should be EditorScreen
            current_screen = pilot.app.screen
            assert isinstance(current_screen, EditorScreen)

    @pytest.mark.asyncio
    async def test_chapter_selection_via_enter_key(self, temp_library: Path) -> None:
        """Test that pressing Enter on a chapter opens the editor."""
        app = LiriacApp(temp_library)

        async with app.run_test() as pilot:
            await pilot.pause()

            # Verify we start with home screen
            home_screen = pilot.app.screen
            assert isinstance(home_screen, HomeScreen)
            initial_screen_count = len(pilot.app.screen_stack)

            # Get the books list and focus it
            books_list = home_screen.query_one("#books-list")
            books_list.focus()
            await pilot.pause()

            # Select first book to load chapters
            if home_screen._book_ids:
                first_book_id = home_screen._book_ids[0]
                home_screen._load_chapters(first_book_id)
                await pilot.pause()

            # Switch focus to chapters list
            await pilot.press("tab")
            await pilot.pause()

            # Get chapters list and verify it has focus
            chapters_list = home_screen.query_one("#chapters-list")
            assert chapters_list.has_focus

            # Check that chapters are loaded
            assert len(chapters_list.children) > 0, "Chapters should be loaded"

            # Try to move to first item to ensure it's highlighted
            await pilot.press("down")  # Move to highlight first item
            await pilot.pause()

            # Press Enter to select the first chapter
            await pilot.press("enter")
            await pilot.pause()

            # Should have opened the editor
            assert len(pilot.app.screen_stack) == initial_screen_count + 1

            # Current screen should be EditorScreen
            current_screen = pilot.app.screen
            assert isinstance(current_screen, EditorScreen)

    @pytest.mark.asyncio
    async def test_home_screen_chapter_selection_action(
        self, temp_library: Path
    ) -> None:
        """Test the home screen's ListView selection event handling."""
        app = LiriacApp(temp_library)

        async with app.run_test() as pilot:
            await pilot.pause()

            # Get the home screen
            home_screen = pilot.app.screen
            assert isinstance(home_screen, HomeScreen)

            # Load books and chapters
            if home_screen._book_ids:
                first_book_id = home_screen._book_ids[0]
                home_screen._load_chapters(first_book_id)
                await pilot.pause()

                # Focus chapters list
                chapters_list = home_screen.query_one("#chapters-list")
                chapters_list.focus()
                await pilot.pause()

                # Manually highlight and select the first chapter using ListView API
                if len(chapters_list.children) > 0:
                    # Try pressing down and enter to select
                    await pilot.press("down", "enter")
                    await pilot.pause()

                    # Should have posted a message that opens the editor
                    # Check if last_selection was updated (indicating message was handled)
                    assert app.last_selection is not None
                    book_id_str, chapter_path_str = app.last_selection
                    assert book_id_str == str(first_book_id)

    @pytest.mark.asyncio
    async def test_message_handler_registration(self, temp_library: Path) -> None:
        """Test that the ChapterChosen message handler is properly registered."""
        app = LiriacApp(temp_library)

        # Check that the app has the on_chapter_chosen method
        assert hasattr(app, "on_chapter_chosen")
        assert callable(app.on_chapter_chosen)

        # Check message handler mapping
        # Textual automatically registers handlers based on method names
        # The handler should be called for ChapterChosen messages
        async with app.run_test() as pilot:
            await pilot.pause()

            from pathlib import PurePosixPath

            ref = ChapterRef(
                book_id=BookId("test-book"),
                relative_path=PurePosixPath("chapters/01-intro.md"),
            )

            # Create and post message
            msg = ChapterChosen(book_id=BookId("test-book"), ref=ref)

            # Store initial screen count
            initial_count = len(pilot.app.screen_stack)

            # Post the message
            pilot.app.post_message(msg)
            await pilot.pause()

            # Should have added a screen
            assert len(pilot.app.screen_stack) == initial_count + 1
            assert isinstance(pilot.app.screen, EditorScreen)
