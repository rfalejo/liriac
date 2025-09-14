"""Tests for domain entities."""

from datetime import UTC, datetime
from pathlib import PurePosixPath

import pytest

from liriac.domain.entities import Book, Chapter, Persona, Suggestion
from liriac.domain.types import (
    BookId,
    ChapterId,
    PersonaId,
    SuggestionId,
    SuggestionSource,
    SuggestionStatus,
)
from liriac.domain.value_objects import ChapterRef


class TestBook:
    """Test Book entity."""

    def test_valid_book_creation(self) -> None:
        """Test Book can be created with valid data."""
        book_id = BookId("test-book")
        title = "Test Book"
        created_at = datetime.now(UTC)
        chapter_ref = ChapterRef(book_id, PurePosixPath("chapters/01.md"))
        persona = Persona(
            id=PersonaId("test-persona"),
            name="Test Character",
            role="Protagonist",
            notes="Main character",
            enabled=True,
        )

        book = Book(
            id=book_id,
            title=title,
            created_at=created_at,
            chapters=(chapter_ref,),
            personas=(persona,),
        )

        assert book.id == book_id
        assert book.title == "Test Book"  # whitespace stripped
        assert book.created_at == created_at
        assert len(book.chapters) == 1
        assert len(book.personas) == 1
        assert isinstance(book.chapters, tuple)
        assert isinstance(book.personas, tuple)

    def test_empty_title_raises_error(self) -> None:
        """Test Book rejects empty title."""
        book_id = BookId("test-book")
        created_at = datetime.now(UTC)

        with pytest.raises(ValueError, match="Book title cannot be empty"):
            Book(
                id=book_id,
                title="",
                created_at=created_at,
                chapters=(),
                personas=(),
            )

        with pytest.raises(ValueError, match="Book title cannot be empty"):
            Book(
                id=book_id,
                title="   ",
                created_at=created_at,
                chapters=(),
                personas=(),
            )

    def test_naive_datetime_raises_error(self) -> None:
        """Test Book rejects naive datetime."""
        book_id = BookId("test-book")
        naive_datetime = datetime.now()

        with pytest.raises(ValueError, match="created_at must be timezone-aware"):
            Book(
                id=book_id,
                title="Test Book",
                created_at=naive_datetime,
                chapters=(),
                personas=(),
            )

    def test_invalid_chapters_type_raises_error(self) -> None:
        """Test Book rejects non-tuple chapters."""
        book_id = BookId("test-book")
        created_at = datetime.now(UTC)

        with pytest.raises(TypeError, match="chapters must be a tuple"):
            Book(
                id=book_id,
                title="Test Book",
                created_at=created_at,
                chapters=[],  # type: ignore[arg-type]  # list instead of tuple
                personas=(),
            )

    def test_invalid_personas_type_raises_error(self) -> None:
        """Test Book rejects non-tuple personas."""
        book_id = BookId("test-book")
        created_at = datetime.now(UTC)

        with pytest.raises(TypeError, match="personas must be a tuple"):
            Book(
                id=book_id,
                title="Test Book",
                created_at=created_at,
                chapters=(),
                personas=[],  # type: ignore[arg-type]  # list instead of tuple
            )

    def test_frozen_behavior(self) -> None:
        """Test Book is frozen (immutable)."""
        book_id = BookId("test-book")
        created_at = datetime.now(UTC)
        book = Book(
            id=book_id,
            title="Test Book",
            created_at=created_at,
            chapters=(),
            personas=(),
        )

        # Test that the object is frozen
        assert hasattr(book, "__dataclass_params__")
        assert getattr(book.__dataclass_params__, "frozen", False)


class TestChapter:
    """Test Chapter entity."""

    def test_valid_chapter_creation(self) -> None:
        """Test Chapter can be created with valid data."""
        book_id = BookId("test-book")
        chapter_id = ChapterId("test-chapter")
        chapter_ref = ChapterRef(book_id, PurePosixPath("chapters/01.md"))
        updated_at = datetime.now(UTC)

        chapter = Chapter(
            id=chapter_id,
            title="Test Chapter",
            ref=chapter_ref,
            text="This is test chapter content.",
            updated_at=updated_at,
        )

        assert chapter.id == chapter_id
        assert chapter.title == "Test Chapter"  # whitespace stripped
        assert chapter.ref == chapter_ref
        assert chapter.text == "This is test chapter content."
        assert chapter.updated_at == updated_at

    def test_empty_title_raises_error(self) -> None:
        """Test Chapter rejects empty title."""
        book_id = BookId("test-book")
        chapter_id = ChapterId("test-chapter")
        chapter_ref = ChapterRef(book_id, PurePosixPath("chapters/01.md"))
        updated_at = datetime.now(UTC)

        with pytest.raises(ValueError, match="Chapter title cannot be empty"):
            Chapter(
                id=chapter_id,
                title="",
                ref=chapter_ref,
                text="Content",
                updated_at=updated_at,
            )

    def test_naive_datetime_raises_error(self) -> None:
        """Test Chapter rejects naive datetime."""
        book_id = BookId("test-book")
        chapter_id = ChapterId("test-chapter")
        chapter_ref = ChapterRef(book_id, PurePosixPath("chapters/01.md"))
        naive_datetime = datetime.now()

        with pytest.raises(ValueError, match="updated_at must be timezone-aware"):
            Chapter(
                id=chapter_id,
                title="Test Chapter",
                ref=chapter_ref,
                text="Content",
                updated_at=naive_datetime,
            )

    def test_immutability(self) -> None:
        """Test Chapter is immutable."""
        book_id = BookId("test-book")
        chapter_id = ChapterId("test-chapter")
        chapter_ref = ChapterRef(book_id, PurePosixPath("chapters/01.md"))
        updated_at = datetime.now(UTC)

        chapter = Chapter(
            id=chapter_id,
            title="Test Chapter",
            ref=chapter_ref,
            text="Content",
            updated_at=updated_at,
        )

        # Test that the object is frozen by checking __dataclass_params__
        assert hasattr(chapter, "__dataclass_params__")
        assert getattr(chapter.__dataclass_params__, "frozen", False)


class TestPersona:
    """Test Persona entity."""

    def test_valid_persona_creation(self) -> None:
        """Test Persona can be created with valid data."""
        persona_id = PersonaId("test-persona")

        persona = Persona(
            id=persona_id,
            name="  Test Character  ",
            role="  Protagonist  ",
            notes="  Main character  ",
            enabled=True,
        )

        assert persona.id == persona_id
        assert persona.name == "Test Character"  # whitespace stripped
        assert persona.role == "Protagonist"  # whitespace stripped
        assert persona.notes == "Main character"  # whitespace stripped
        assert persona.enabled is True

    def test_valid_persona_with_none_fields(self) -> None:
        """Test Persona can be created with None role and notes."""
        persona_id = PersonaId("test-persona")

        persona = Persona(
            id=persona_id,
            name="Test Character",
            role=None,
            notes=None,
            enabled=False,
        )

        assert persona.id == persona_id
        assert persona.name == "Test Character"
        assert persona.role is None
        assert persona.notes is None
        assert persona.enabled is False

    def test_empty_name_raises_error(self) -> None:
        """Test Persona rejects empty name."""
        persona_id = PersonaId("test-persona")

        with pytest.raises(ValueError, match="Persona name cannot be empty"):
            Persona(
                id=persona_id,
                name="",
                role=None,
                notes=None,
                enabled=True,
            )

    def test_immutability(self) -> None:
        """Test Persona is immutable."""
        persona_id = PersonaId("test-persona")

        persona = Persona(
            id=persona_id,
            name="Test Character",
            role=None,
            notes=None,
            enabled=True,
        )

        # Test that the object is frozen by checking __dataclass_params__
        assert hasattr(persona, "__dataclass_params__")
        assert getattr(persona.__dataclass_params__, "frozen", False)


class TestSuggestion:
    """Test Suggestion entity."""

    def test_valid_suggestion_creation(self) -> None:
        """Test Suggestion can be created with valid data."""
        suggestion_id = SuggestionId("test-suggestion")
        created_at = datetime.now(UTC)
        source: SuggestionSource = "ai"
        status: SuggestionStatus = "pending"

        suggestion = Suggestion(
            id=suggestion_id,
            text="  This is a test suggestion.  ",
            source=source,
            created_at=created_at,
            status=status,
        )

        assert suggestion.id == suggestion_id
        assert suggestion.text == "This is a test suggestion."  # whitespace stripped
        assert suggestion.source == source
        assert suggestion.created_at == created_at
        assert suggestion.status == status

    def test_empty_text_raises_error(self) -> None:
        """Test Suggestion rejects empty text."""
        suggestion_id = SuggestionId("test-suggestion")
        created_at = datetime.now(UTC)

        with pytest.raises(ValueError, match="Suggestion text cannot be empty"):
            Suggestion(
                id=suggestion_id,
                text="",
                source="ai",
                created_at=created_at,
                status="pending",
            )

    def test_naive_datetime_raises_error(self) -> None:
        """Test Suggestion rejects naive datetime."""
        suggestion_id = SuggestionId("test-suggestion")
        naive_datetime = datetime.now()

        with pytest.raises(ValueError, match="created_at must be timezone-aware"):
            Suggestion(
                id=suggestion_id,
                text="Test suggestion",
                source="ai",
                created_at=naive_datetime,
                status="pending",
            )

    def test_immutability(self) -> None:
        """Test Suggestion is immutable."""
        suggestion_id = SuggestionId("test-suggestion")
        created_at = datetime.now(UTC)

        suggestion = Suggestion(
            id=suggestion_id,
            text="Test suggestion",
            source="ai",
            created_at=created_at,
            status="pending",
        )

        # Test that the object is frozen by checking __dataclass_params__
        assert hasattr(suggestion, "__dataclass_params__")
        assert getattr(suggestion.__dataclass_params__, "frozen", False)
