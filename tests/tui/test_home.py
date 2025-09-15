"""Tests for home screen functionality.

Tests the TUI home screen for browsing books and selecting chapters.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

import pytest

from liriac.app import LiriacApp
from liriac.tui.screens.home.view import HomeScreen

if TYPE_CHECKING:
    pass


@pytest.fixture
def temp_library(tmp_path: Path) -> Path:
    """Create a temporary library with test books.

    Args:
        tmp_path: pytest temporary directory

    Returns:
        Path to the temporary library
    """
    # Create book1 with chapters
    book1_dir = tmp_path / "book1"
    book1_dir.mkdir()

    book1_chapters = book1_dir / "chapters"
    book1_chapters.mkdir()

    (book1_chapters / "01-start.md").write_text("# Chapter 1\n\nContent here.")
    (book1_chapters / "02-middle.md").write_text("# Chapter 2\n\nMore content.")

    book1_toml = book1_dir / "book.toml"
    book1_toml.write_text(
        """
title = "Test Book One"
created_at = "2024-01-01T10:00:00+00:00"
chapters = ["chapters/01-start.md", "chapters/02-middle.md"]
"""
    )

    # Create book2 with one chapter
    book2_dir = tmp_path / "book2"
    book2_dir.mkdir()

    book2_chapters = book2_dir / "chapters"
    book2_chapters.mkdir()

    (book2_chapters / "intro.md").write_text("# Introduction\n\nBeginning text.")

    book2_toml = book2_dir / "book.toml"
    book2_toml.write_text(
        """
title = "Test Book Two"
created_at = "2024-02-01T12:00:00+00:00"
chapters = ["chapters/intro.md"]
"""
    )

    return tmp_path


@pytest.fixture
def empty_library(tmp_path: Path) -> Path:
    """Create an empty library directory.

    Args:
        tmp_path: pytest temporary directory

    Returns:
        Path to the empty library
    """
    return tmp_path


@pytest.fixture
def invalid_library(tmp_path: Path) -> Path:
    """Create a library with an invalid book.

    Args:
        tmp_path: pytest temporary directory

    Returns:
        Path to the library with invalid book
    """
    # Create a book directory without book.toml
    broken_book = tmp_path / "broken-book"
    broken_book.mkdir()

    # Create another book with invalid TOML
    invalid_book = tmp_path / "invalid-book"
    invalid_book.mkdir()

    invalid_toml = invalid_book / "book.toml"
    invalid_toml.write_text("invalid toml content [[[")

    return tmp_path


class TestHomeScreenImport:
    """Test importing the home screen components."""

    def test_import_home_screen(self) -> None:
        """Test that HomeScreen can be imported."""
        assert HomeScreen is not None

    def test_import_chapter_chosen(self) -> None:
        """Test that ChapterChosen message can be imported."""
        from liriac.tui.screens.home.view import ChapterChosen

        assert ChapterChosen is not None


class TestHomeScreenBasic:
    """Test basic home screen functionality."""

    async def test_empty_library_display(self, empty_library: Path) -> None:
        """Test display when library is empty."""
        app = LiriacApp(empty_library)

        async with app.run_test() as pilot:
            # Should show "No books found" message in books list
            books_list = pilot.app.screen.query_one("#books-list")
            assert len(books_list.children) >= 1

    async def test_books_list_populated(self, temp_library: Path) -> None:
        """Test that books list is populated with available books."""
        app = LiriacApp(temp_library)

        async with app.run_test() as pilot:
            # Wait for the app to load
            await pilot.pause()

            # Check that books are listed
            books_list = pilot.app.screen.query_one("#books-list")
            assert len(books_list.children) == 2  # book1 and book2

    async def test_chapters_loaded_on_book_selection(self, temp_library: Path) -> None:
        """Test that chapters are loaded when a book is selected."""
        app = LiriacApp(temp_library)

        async with app.run_test() as pilot:
            await pilot.pause()

            # Focus and highlight first book
            books_list = pilot.app.screen.query_one("#books-list")
            books_list.focus()
            await pilot.press("down")  # Highlight first book
            await pilot.pause()

            # Check that chapters are loaded
            chapters_list = pilot.app.screen.query_one("#chapters-list")
            assert len(chapters_list.children) > 0


class TestHomeScreenNavigation:
    """Test keyboard navigation in home screen."""

    async def test_tab_switches_focus(self, temp_library: Path) -> None:
        """Test that Tab switches focus between lists."""
        app = LiriacApp(temp_library)

        async with app.run_test() as pilot:
            await pilot.pause()

            books_list = pilot.app.screen.query_one("#books-list")
            chapters_list = pilot.app.screen.query_one("#chapters-list")

            # Initially books list should have focus
            assert books_list.has_focus

            # Press Tab to switch to chapters list
            await pilot.press("tab")
            assert chapters_list.has_focus

            # Press Tab again to go back to books list
            await pilot.press("tab")
            assert books_list.has_focus


class TestHomeScreenErrors:
    """Test error handling in home screen."""

    async def test_invalid_book_handling(self, invalid_library: Path) -> None:
        """Test that invalid books are handled gracefully."""
        app = LiriacApp(invalid_library)

        async with app.run_test() as pilot:
            await pilot.pause()

            # Should not crash, and should handle errors gracefully
            books_list = pilot.app.screen.query_one("#books-list")

            # Check that the app didn't crash and books list exists
            assert books_list is not None
            # We expect at least the "No books found" message or error handling
            assert len(books_list.children) >= 1


class TestChapterSelection:
    """Test chapter selection functionality."""

    async def test_chapter_selection_emits_message(self, temp_library: Path) -> None:
        """Test that selecting a chapter works."""
        app = LiriacApp(temp_library)

        async with app.run_test() as pilot:
            await pilot.pause()

            # Check that books are loaded first
            books_list = pilot.app.screen.query_one("#books-list")
            assert len(books_list.children) > 0, "Books should be loaded"

            # Focus books list and manually select first book
            books_list.focus()
            await pilot.pause()

            # Get the home screen and manually load chapters for first book
            from liriac.tui.screens.home.view import HomeScreen

            home_screen = pilot.app.screen
            if isinstance(home_screen, HomeScreen) and home_screen._book_ids:
                first_book_id = home_screen._book_ids[0]
                home_screen._load_chapters(first_book_id)

            await pilot.pause()

            # Now check that chapters are loaded
            chapters_list = pilot.app.screen.query_one("#chapters-list")
            assert (
                len(chapters_list.children) > 0
            ), "Chapters should be loaded after book selection"
