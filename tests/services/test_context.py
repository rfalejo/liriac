"""Tests for context management services."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from unittest.mock import Mock

import pytest

from liriac.domain.entities import Chapter
from liriac.domain.types import BookId, ChapterId, ContextProfile, PersonaRef
from liriac.domain.value_objects import ChapterRef
from liriac.services.context import (
    SelectionState,
    build_context,
    estimate_profile_tokens,
)
from liriac.services.context.limits import estimate_tokens


class TestSelectionState:
    """Test SelectionState functionality."""

    def test_initial_state_empty(self) -> None:
        """Test that SelectionState starts with empty selections."""
        state = SelectionState()
        assert len(state.selected_chapters) == 0
        assert len(state.selected_personas) == 0

    def test_toggle_chapter_adds_when_not_present(self) -> None:
        """Test that toggling a chapter adds it when not present."""
        state = SelectionState()
        chapter_ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter1.md"),
        )

        state.toggle_chapter(chapter_ref)
        assert chapter_ref in state.selected_chapters

    def test_toggle_chapter_removes_when_present(self) -> None:
        """Test that toggling a chapter removes it when present."""
        state = SelectionState()
        chapter_ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter1.md"),
        )

        # Add first
        state.toggle_chapter(chapter_ref)
        assert chapter_ref in state.selected_chapters

        # Remove
        state.toggle_chapter(chapter_ref)
        assert chapter_ref not in state.selected_chapters

    def test_toggle_persona_adds_when_not_present(self) -> None:
        """Test that toggling a persona adds it when not present."""
        state = SelectionState()
        persona_ref = PersonaRef("hero")

        state.toggle_persona(persona_ref)
        assert persona_ref in state.selected_personas

    def test_toggle_persona_removes_when_present(self) -> None:
        """Test that toggling a persona removes it when present."""
        state = SelectionState()
        persona_ref = PersonaRef("hero")

        # Add first
        state.toggle_persona(persona_ref)
        assert persona_ref in state.selected_personas

        # Remove
        state.toggle_persona(persona_ref)
        assert persona_ref not in state.selected_personas

    def test_clear_removes_all_selections(self) -> None:
        """Test that clear removes all selections."""
        state = SelectionState()
        chapter_ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter1.md"),
        )
        persona_ref = PersonaRef("hero")

        state.toggle_chapter(chapter_ref)
        state.toggle_persona(persona_ref)

        state.clear()

        assert len(state.selected_chapters) == 0
        assert len(state.selected_personas) == 0

    def test_snapshot_returns_immutable_tuples(self) -> None:
        """Test that snapshot returns immutable tuples of selections."""
        state = SelectionState()
        chapter_ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter1.md"),
        )
        persona_ref = PersonaRef("hero")

        state.toggle_chapter(chapter_ref)
        state.toggle_persona(persona_ref)

        chapters, personas = state.snapshot()

        assert isinstance(chapters, tuple)
        assert isinstance(personas, tuple)
        assert chapter_ref in chapters
        assert persona_ref in personas


class TestBuildContext:
    """Test build_context function."""

    def test_build_context_returns_context_profile(self) -> None:
        """Test that build_context returns a ContextProfile with provided data."""
        chapter_ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter1.md"),
        )
        chapters = (chapter_ref,)
        personas = (PersonaRef("hero"),)
        system_prompt = "Test prompt"

        profile = build_context(
            chapters=chapters,
            personas=personas,
            system_prompt=system_prompt,
        )

        assert isinstance(profile, ContextProfile)
        assert profile.chapters == chapters
        assert profile.personas == personas
        assert profile.system_prompt == system_prompt

    def test_build_context_immutable(self) -> None:
        """Test that build_context returns an immutable ContextProfile."""
        profile = build_context(
            chapters=(),
            personas=(),
            system_prompt="Test",
        )

        # ContextProfile is frozen, so this should raise AttributeError
        with pytest.raises(AttributeError):
            profile.chapters = ()  # type: ignore


class TestEstimateTokens:
    """Test token estimation functions."""

    def test_estimate_tokens_empty_string(self) -> None:
        """Test that empty string returns 0 tokens."""
        assert estimate_tokens("") == 0

    def test_estimate_tokens_short_text(self) -> None:
        """Test token estimation for short text."""
        text = "Hello"
        tokens = estimate_tokens(text)
        expected = max(1, round(len(text) / 4))
        assert tokens == expected

    def test_estimate_tokens_longer_text(self) -> None:
        """Test token estimation for longer text."""
        text = "This is a longer text with multiple words and should have more tokens."
        tokens = estimate_tokens(text)
        expected = max(1, round(len(text) / 4))
        assert tokens == expected

    def test_estimate_tokens_minimum_one(self) -> None:
        """Test that non-empty text returns at least 1 token."""
        text = "a"
        tokens = estimate_tokens(text)
        assert tokens >= 1


class TestEstimateProfileTokens:
    """Test profile token estimation with repository integration."""

    def test_estimate_profile_tokens_empty_profile(self) -> None:
        """Test token estimation for empty profile."""
        mock_repo = Mock()
        library_path = Path("/tmp")

        profile = ContextProfile(
            chapters=(),
            personas=(),
            system_prompt="",
        )

        tokens = estimate_profile_tokens(library_path, mock_repo, profile)
        assert tokens == 0
        mock_repo.read_chapter.assert_not_called()

    def test_estimate_profile_tokens_with_system_prompt_only(self) -> None:
        """Test token estimation for profile with only system prompt."""
        mock_repo = Mock()
        library_path = Path("/tmp")

        system_prompt = "This is a system prompt."
        profile = ContextProfile(
            chapters=(),
            personas=(),
            system_prompt=system_prompt,
        )

        tokens = estimate_profile_tokens(library_path, mock_repo, profile)
        expected = estimate_tokens(system_prompt)
        assert tokens == expected
        mock_repo.read_chapter.assert_not_called()

    def test_estimate_profile_tokens_with_chapters(self) -> None:
        """Test token estimation for profile with chapters."""
        mock_repo = Mock()
        library_path = Path("/tmp")

        chapter_ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter1.md"),
        )

        # Mock chapter content
        chapter_ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter1.md"),
        )
        mock_chapter = Chapter(
            id=ChapterId("ch1"),
            title="Test Chapter",
            ref=chapter_ref,
            text="This is chapter content.",
            updated_at=datetime.now(UTC),
        )
        mock_repo.read_chapter.return_value = mock_chapter

        system_prompt = "System prompt."
        profile = ContextProfile(
            chapters=(chapter_ref,),
            personas=(),
            system_prompt=system_prompt,
        )

        tokens = estimate_profile_tokens(library_path, mock_repo, profile)

        # Should combine system prompt + chapter text
        expected_text = system_prompt + "\n" + mock_chapter.text
        expected_tokens = estimate_tokens(expected_text)
        assert tokens == expected_tokens

        mock_repo.read_chapter.assert_called_once_with(library_path, chapter_ref)

    def test_estimate_profile_tokens_multiple_chapters(self) -> None:
        """Test token estimation for profile with multiple chapters."""
        mock_repo = Mock()
        library_path = Path("/tmp")

        chapter_ref1 = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter1.md"),
        )
        chapter_ref2 = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapter2.md"),
        )

        # Mock chapter content
        mock_chapter1 = Chapter(
            id=ChapterId("ch1"),
            title="Test Chapter 1",
            ref=chapter_ref1,
            text="Chapter 1 content.",
            updated_at=datetime.now(UTC),
        )
        mock_chapter2 = Chapter(
            id=ChapterId("ch2"),
            title="Test Chapter 2",
            ref=chapter_ref2,
            text="Chapter 2 content.",
            updated_at=datetime.now(UTC),
        )

        mock_repo.read_chapter.side_effect = [mock_chapter1, mock_chapter2]

        system_prompt = "System prompt."
        profile = ContextProfile(
            chapters=(chapter_ref1, chapter_ref2),
            personas=(),
            system_prompt=system_prompt,
        )

        tokens = estimate_profile_tokens(library_path, mock_repo, profile)

        # Should combine system prompt + all chapter texts
        expected_text = (
            system_prompt + "\n" + mock_chapter1.text + "\n" + mock_chapter2.text
        )
        expected_tokens = estimate_tokens(expected_text)
        assert tokens == expected_tokens

        assert mock_repo.read_chapter.call_count == 2
