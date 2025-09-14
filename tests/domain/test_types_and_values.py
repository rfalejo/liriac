"""Tests for domain types and value objects."""

from pathlib import PurePosixPath

import pytest

from liriac.domain.types import (
    BookId,
    ChapterId,
    PersonaId,
    SuggestionId,
    SuggestionSource,
    SuggestionStatus,
)
from liriac.domain.value_objects import ChapterRef, PersonaRef


class TestTypes:
    """Test domain types behave correctly."""

    def test_book_id_roundtrip(self) -> None:
        """Test BookId behaves as string and roundtrips correctly."""
        book_id = BookId("test-book")
        assert book_id == "test-book"
        assert str(book_id) == "test-book"
        assert repr(book_id) == "'test-book'"

    def test_chapter_id_roundtrip(self) -> None:
        """Test ChapterId behaves as string and roundtrips correctly."""
        chapter_id = ChapterId("test-chapter")
        assert chapter_id == "test-chapter"
        assert str(chapter_id) == "test-chapter"
        assert repr(chapter_id) == "'test-chapter'"

    def test_persona_id_roundtrip(self) -> None:
        """Test PersonaId behaves as string and roundtrips correctly."""
        persona_id = PersonaId("test-persona")
        assert persona_id == "test-persona"
        assert str(persona_id) == "test-persona"
        assert repr(persona_id) == "'test-persona'"

    def test_suggestion_id_roundtrip(self) -> None:
        """Test SuggestionId behaves as string and roundtrips correctly."""
        suggestion_id = SuggestionId("test-suggestion")
        assert suggestion_id == "test-suggestion"
        assert str(suggestion_id) == "test-suggestion"
        assert repr(suggestion_id) == "'test-suggestion'"

    def test_suggestion_status_literal(self) -> None:
        """Test SuggestionStatus accepts valid literal values."""
        valid_statuses: list[SuggestionStatus] = ["pending", "accepted", "rejected"]
        for status in valid_statuses:
            assert isinstance(status, str)
            assert status in ["pending", "accepted", "rejected"]

    def test_suggestion_source_literal(self) -> None:
        """Test SuggestionSource accepts valid literal values."""
        valid_sources: list[SuggestionSource] = ["ai", "user"]
        for source in valid_sources:
            assert isinstance(source, str)
            assert source in ["ai", "user"]


class TestChapterRef:
    """Test ChapterRef value object."""

    def test_valid_chapter_ref(self) -> None:
        """Test ChapterRef accepts valid relative paths."""
        book_id = BookId("test-book")
        path = PurePosixPath("chapters/01.md")
        ref = ChapterRef(book_id, path)
        assert ref.book_id == book_id
        assert ref.relative_path == path

    def test_empty_book_id_raises_error(self) -> None:
        """Test ChapterRef rejects empty book_id."""
        with pytest.raises(ValueError, match="Book ID cannot be empty"):
            ChapterRef(BookId(""), PurePosixPath("chapters/01.md"))

    def test_absolute_path_raises_error(self) -> None:
        """Test ChapterRef rejects absolute paths."""
        book_id = BookId("test-book")
        with pytest.raises(ValueError, match="Chapter path must be relative"):
            ChapterRef(book_id, PurePosixPath("/chapters/01.md"))

    def test_uplevel_path_raises_error(self) -> None:
        """Test ChapterRef rejects paths with up-level references."""
        book_id = BookId("test-book")
        with pytest.raises(
            ValueError, match="Chapter path cannot contain up-level references"
        ):
            ChapterRef(book_id, PurePosixPath("../chapters/01.md"))

    def test_immutability(self) -> None:
        """Test ChapterRef is immutable."""
        book_id = BookId("test-book")
        path = PurePosixPath("chapters/01.md")
        ref = ChapterRef(book_id, path)

        # Test that the object is frozen by checking __dataclass_params__
        assert hasattr(ref, "__dataclass_params__")
        assert getattr(ref.__dataclass_params__, "frozen", False)


class TestPersonaRef:
    """Test PersonaRef value object."""

    def test_valid_persona_ref(self) -> None:
        """Test PersonaRef accepts valid IDs."""
        book_id = BookId("test-book")
        persona_id = PersonaId("test-persona")
        ref = PersonaRef(book_id, persona_id)
        assert ref.book_id == book_id
        assert ref.persona_id == persona_id

    def test_empty_book_id_raises_error(self) -> None:
        """Test PersonaRef rejects empty book_id."""
        with pytest.raises(ValueError, match="Book ID cannot be empty"):
            PersonaRef(BookId(""), PersonaId("test-persona"))

    def test_empty_persona_id_raises_error(self) -> None:
        """Test PersonaRef rejects empty persona_id."""
        with pytest.raises(ValueError, match="Persona ID cannot be empty"):
            PersonaRef(BookId("test-book"), PersonaId(""))

    def test_immutability(self) -> None:
        """Test PersonaRef is immutable."""
        book_id = BookId("test-book")
        persona_id = PersonaId("test-persona")
        ref = PersonaRef(book_id, persona_id)

        # Test that the object is frozen by checking __dataclass_params__
        assert hasattr(ref, "__dataclass_params__")
        assert getattr(ref.__dataclass_params__, "frozen", False)
