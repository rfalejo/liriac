"""Tests for context screen TUI component."""

from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import Mock

import pytest

from liriac.app import LiriacApp
from liriac.domain.entities import Book
from liriac.domain.types import BookId
from liriac.domain.value_objects import ChapterRef
from liriac.tui import ContextCommitted, ContextScreen


class TestContextScreenImports:
    """Test that context screen imports work correctly."""

    def test_can_import_context_screen(self) -> None:
        """Test that ContextScreen can be imported."""
        assert ContextScreen is not None

    def test_can_import_context_committed(self) -> None:
        """Test that ContextCommitted can be imported."""
        assert ContextCommitted is not None


class TestContextScreenBasic:
    """Test basic ContextScreen functionality."""

    def test_context_screen_init(self) -> None:
        """Test that ContextScreen can be initialized."""
        library_path = Path("/tmp")
        mock_repo = Mock()

        screen = ContextScreen(library_path, mock_repo)

        assert screen.library_path == library_path
        assert screen.repo == mock_repo
        assert screen.current_book_id is None

    def test_context_screen_with_system_prompt(self) -> None:
        """Test ContextScreen initialization with system prompt."""
        library_path = Path("/tmp")
        mock_repo = Mock()
        system_prompt = "Test prompt"

        screen = ContextScreen(library_path, mock_repo, system_prompt)

        assert screen.initial_system_prompt == system_prompt


@pytest.mark.asyncio
class TestContextScreenIntegration:
    """Integration tests for ContextScreen with Textual."""

    async def test_context_screen_can_be_opened(self) -> None:
        """Test that ContextScreen can be opened in app without crashing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            library_path = Path(temp_dir)
            app = LiriacApp(library_path)

            async with app.run_test():
                # The app should start with home screen
                assert len(app.screen_stack) >= 1

                # Create and push context screen
                context_screen = ContextScreen(library_path, app.repo)
                app.push_screen(context_screen)

                # Context screen should be on top of stack
                assert app.screen is context_screen

    async def test_context_screen_escape_returns_without_crashing(self) -> None:
        """Test that pressing escape returns to previous screen without crashing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            library_path = Path(temp_dir)
            app = LiriacApp(library_path)

            async with app.run_test() as pilot:
                initial_stack_size = len(app.screen_stack)

                # Push context screen
                context_screen = ContextScreen(library_path, app.repo)
                app.push_screen(context_screen)

                assert len(app.screen_stack) == initial_stack_size + 1

                # Press escape
                await pilot.press("escape")

                # Should return to previous screen
                assert len(app.screen_stack) == initial_stack_size

    async def test_context_screen_with_mock_books(self) -> None:
        """Test ContextScreen with mocked book data."""
        with tempfile.TemporaryDirectory() as temp_dir:
            library_path = Path(temp_dir)

            # Create a mock repository with test data
            mock_repo = Mock()
            mock_repo.list_books.return_value = (BookId("test-book"),)

            # Create mock book with chapters
            from datetime import UTC, datetime
            from pathlib import PurePosixPath

            chapter_ref = ChapterRef(
                book_id=BookId("test-book"),
                relative_path=PurePosixPath("chapter1.md"),
            )
            mock_book = Book(
                id=BookId("test-book"),
                title="Test Book",
                chapters=(chapter_ref,),
                personas=(),
                created_at=datetime.now(UTC),
            )
            mock_repo.load_book.return_value = mock_book

            # Create app with mock repo
            app = LiriacApp(library_path)
            app.repo = mock_repo

            async with app.run_test() as pilot:
                # Push context screen
                context_screen = ContextScreen(library_path, mock_repo)
                app.push_screen(context_screen)

                # Allow screen to mount and compose
                await pilot.pause()

                # Books list should be populated
                books_list = context_screen.query_one("#books-list")
                assert books_list is not None

    async def test_app_opens_context_screen_on_c_key(self) -> None:
        """Test that pressing 'c' opens the context screen."""
        with tempfile.TemporaryDirectory() as temp_dir:
            library_path = Path(temp_dir)
            app = LiriacApp(library_path)

            async with app.run_test() as pilot:
                initial_stack_size = len(app.screen_stack)

                # Press 'c' to open context screen
                await pilot.press("c")

                # Should have pushed context screen
                assert len(app.screen_stack) == initial_stack_size + 1
                assert isinstance(app.screen, ContextScreen)

    async def test_context_committed_message_handled(self) -> None:
        """Test that ContextCommitted message is handled by app."""
        with tempfile.TemporaryDirectory() as temp_dir:
            library_path = Path(temp_dir)
            app = LiriacApp(library_path)

            async with app.run_test() as pilot:
                # Initial state should have no context profile
                assert app.last_context_profile is None

                # Open context screen
                await pilot.press("c")
                context_screen = app.screen
                assert isinstance(context_screen, ContextScreen)

                # Simulate committing context (this would normally be done
                # through UI interaction, but we'll test the message handling)
                from liriac.services.context import build_context

                test_profile = build_context(
                    chapters=(),
                    personas=(),
                    system_prompt="Test prompt",
                )

                # Post the message
                context_screen.post_message(ContextCommitted(test_profile))

                # Allow message processing
                await pilot.pause()

                # App should have stored the profile
                profile = app.last_context_profile
                if profile is not None:
                    assert profile.system_prompt == "Test prompt", f"Expected 'Test prompt', got {profile.system_prompt!r}"  # type: ignore[unreachable]
                else:
                    pytest.fail("Context profile should be stored")


class TestContextScreenWidgets:
    """Test ContextScreen widget composition."""

    def test_context_screen_has_required_widgets(self) -> None:
        """Test that ContextScreen compose method creates required widgets."""
        library_path = Path("/tmp")
        mock_repo = Mock()

        screen = ContextScreen(library_path, mock_repo)

        # Test that compose method exists and returns widgets
        compose_result = screen.compose()
        widgets = list(compose_result)

        # Should have header, main content, prompt section, and footer
        assert len(widgets) >= 3
