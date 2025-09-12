"""Tests for Book and Chapter entities.

This module tests the domain entities with their invariants, validations,
and mutator operations.
"""

from __future__ import annotations

import pytest

from liriac.domain import Book, Chapter, DomainError, InvariantViolation, SlugInvalid


class TestBook:
    """Test cases for the Book entity."""

    def test_valid_book_creation(self) -> None:
        """Test creating a book with valid fields."""
        book = Book(id="test-book", slug="my-fantasy-novel", title="My Fantasy Novel")
        assert book.id == "test-book"
        assert book.slug == "my-fantasy-novel"
        assert book.title == "My Fantasy Novel"

    def test_book_title_normalization(self) -> None:
        """Test that titles are trimmed."""
        book = Book(id="test", slug="test", title="  Spaces Around Title  ")
        assert book.title == "Spaces Around Title"

    def test_empty_title_raises_error(self) -> None:
        """Test that empty title raises InvariantViolation."""
        with pytest.raises(InvariantViolation, match="Title cannot be empty"):
            Book(id="test", slug="test", title="")

        with pytest.raises(InvariantViolation, match="Title cannot be whitespace"):
            Book(id="test", slug="test", title="   ")

    def test_invalid_slug_raises_error(self) -> None:
        """Test that invalid slug raises SlugInvalid."""
        with pytest.raises(SlugInvalid, match="must be lowercase-hyphenated"):
            Book(id="test", slug="Invalid Slug", title="Test")

        with pytest.raises(SlugInvalid, match="cannot start or end with hyphen"):
            Book(id="test", slug="-invalid", title="Test")

        with pytest.raises(SlugInvalid, match="cannot contain consecutive hyphens"):
            Book(id="test", slug="invalid--slug", title="Test")

    def test_empty_id_raises_error(self) -> None:
        """Test that empty id raises InvariantViolation."""
        with pytest.raises(InvariantViolation, match="BookId cannot be empty"):
            Book(id="", slug="test", title="Test")

        with pytest.raises(InvariantViolation, match="BookId cannot be empty"):
            Book(id="   ", slug="test", title="Test")

    def test_retitle_updates_title(self) -> None:
        """Test retitle method updates the title."""
        book = Book(id="test", slug="test", title="Original Title")
        book.retitle("New Title")
        assert book.title == "New Title"

    def test_retitle_normalizes_input(self) -> None:
        """Test retitle method normalizes input."""
        book = Book(id="test", slug="test", title="Original")
        book.retitle("  New Title  ")
        assert book.title == "New Title"

    def test_retitle_rejects_invalid_title(self) -> None:
        """Test retitle method rejects invalid titles."""
        book = Book(id="test", slug="test", title="Original")
        with pytest.raises(InvariantViolation, match="Title cannot be empty"):
            book.retitle("")

    def test_reslug_updates_slug(self) -> None:
        """Test reslug method updates the slug."""
        book = Book(id="test", slug="old-slug", title="Test")
        book.reslug("new-slug")
        assert book.slug == "new-slug"

    def test_reslug_rejects_invalid_slug(self) -> None:
        """Test reslug method rejects invalid slugs."""
        book = Book(id="test", slug="old", title="Test")
        with pytest.raises(SlugInvalid):
            book.reslug("Invalid Slug")

    def test_string_representations(self) -> None:
        """Test string representations for debugging."""
        book = Book(id="test-book", slug="my-novel", title="My Novel")

        # Test __str__
        str_repr = str(book)
        assert "slug='my-novel'" in str_repr
        assert "title='My Novel'" in str_repr

        # Test __repr__
        repr_str = repr(book)
        assert "id='test-book'" in repr_str
        assert "slug='my-novel'" in repr_str
        assert "title='My Novel'" in repr_str


class TestChapter:
    """Test cases for the Chapter entity."""

    def test_valid_chapter_creation(self) -> None:
        """Test creating a chapter with valid fields."""
        chapter = Chapter(
            id="ch_01", number=1, title="Prologue", text="Once upon a time..."
        )
        assert chapter.id == "ch_01"
        assert chapter.number == 1
        assert chapter.title == "Prologue"
        assert chapter.text == "Once upon a time..."

    def test_chapter_id_normalization(self) -> None:
        """Test that chapter id is normalized to zero-padded format."""
        chapter = Chapter(id="ch_1", number=1, title="Test", text="Content")
        assert chapter.id == "ch_01"  # Normalized to zero-padded

    def test_chapter_number_must_be_positive(self) -> None:
        """Test that chapter number must be positive."""
        with pytest.raises(InvariantViolation, match="Chapter number must be positive"):
            Chapter(id="ch_00", number=0, title="Test", text="Content")

        with pytest.raises(InvariantViolation, match="Chapter number must be positive"):
            Chapter(id="ch_-1", number=-1, title="Test", text="Content")

    def test_chapter_id_mismatch_raises_error(self) -> None:
        """Test that mismatched id and number raises error."""
        with pytest.raises(InvariantViolation, match="inconsistent with number"):
            Chapter(id="ch_01", number=2, title="Test", text="Content")

    def test_invalid_chapter_id_format_raises_error(self) -> None:
        """Test that invalid chapter id format raises error."""
        with pytest.raises(InvariantViolation, match="must start with 'ch_'"):
            Chapter(id="invalid", number=1, title="Test", text="Content")

        with pytest.raises(InvariantViolation, match="must have numeric suffix"):
            Chapter(id="ch_abc", number=1, title="Test", text="Content")

    def test_chapter_title_normalization(self) -> None:
        """Test that chapter titles are trimmed."""
        chapter = Chapter(
            id="ch_01", number=1, title="  Padded Title  ", text="Content"
        )
        assert chapter.title == "Padded Title"

    def test_empty_chapter_title_raises_error(self) -> None:
        """Test that empty chapter title raises error."""
        with pytest.raises(InvariantViolation, match="Title cannot be empty"):
            Chapter(id="ch_01", number=1, title="", text="Content")

    def test_chapter_text_allows_empty_string(self) -> None:
        """Test that chapter text can be empty string."""
        chapter = Chapter(id="ch_01", number=1, title="Test", text="")
        assert chapter.text == ""

    def test_chapter_text_none_raises_error(self) -> None:
        """Test that None text raises error."""
        with pytest.raises(InvariantViolation, match="Markdown cannot be None"):
            Chapter(id="ch_01", number=1, title="Test", text=None)  # type: ignore

    def test_retitle_updates_title(self) -> None:
        """Test retitle method updates the title."""
        chapter = Chapter(id="ch_01", number=1, title="Original", text="Content")
        chapter.retitle("New Title")
        assert chapter.title == "New Title"

    def test_renumber_updates_number_and_id(self) -> None:
        """Test renumber method updates both number and id."""
        chapter = Chapter(id="ch_01", number=1, title="Test", text="Content")
        chapter.renumber(5)
        assert chapter.number == 5
        assert chapter.id == "ch_05"

    def test_renumber_rejects_invalid_number(self) -> None:
        """Test renumber method rejects invalid numbers."""
        chapter = Chapter(id="ch_01", number=1, title="Test", text="Content")
        with pytest.raises(InvariantViolation, match="Chapter number must be positive"):
            chapter.renumber(0)

    def test_replace_text_updates_content(self) -> None:
        """Test replace_text method updates text content."""
        chapter = Chapter(id="ch_01", number=1, title="Test", text="Original")
        chapter.replace_text("New content")
        assert chapter.text == "New content"

    def test_replace_text_allows_empty_string(self) -> None:
        """Test replace_text method allows empty string."""
        chapter = Chapter(id="ch_01", number=1, title="Test", text="Content")
        chapter.replace_text("")
        assert chapter.text == ""

    def test_replace_text_rejects_none(self) -> None:
        """Test replace_text method rejects None."""
        chapter = Chapter(id="ch_01", number=1, title="Test", text="Content")
        with pytest.raises(InvariantViolation, match="Markdown cannot be None"):
            chapter.replace_text(None)  # type: ignore

    def test_string_representations(self) -> None:
        """Test string representations for debugging."""
        chapter = Chapter(
            id="ch_01", number=1, title="Prologue", text="Once upon a time..."
        )

        # Test __str__
        str_repr = str(chapter)
        assert "id='ch_01'" in str_repr
        assert "title='Prologue'" in str_repr

        # Test __repr__
        repr_str = repr(chapter)
        assert "id='ch_01'" in repr_str
        assert "number=1" in repr_str
        assert "title='Prologue'" in repr_str
        assert "text='Once upon a time...'" in repr_str

    def test_multiple_chapters_with_different_numbers(self) -> None:
        """Test creating multiple chapters with different numbers."""
        ch1 = Chapter(id="ch_01", number=1, title="One", text="First")
        ch2 = Chapter(id="ch_02", number=2, title="Two", text="Second")
        ch10 = Chapter(id="ch_10", number=10, title="Ten", text="Tenth")

        assert ch1.id == "ch_01"
        assert ch2.id == "ch_02"
        assert ch10.id == "ch_10"


class TestCrossCuttingConcerns:
    """Tests that apply to both entities."""

    def test_entities_are_mutable(self) -> None:
        """Test that entities are mutable (MVP design)."""
        book = Book(id="test", slug="test", title="Original")
        chapter = Chapter(id="ch_01", number=1, title="Original", text="Content")

        # Modify in place
        book.retitle("New")
        chapter.retitle("New")

        assert book.title == "New"
        assert chapter.title == "New"

    def test_domain_errors_are_catchable(self) -> None:
        """Test that domain errors can be caught as base DomainError."""
        with pytest.raises(DomainError):
            Book(id="", slug="test", title="Test")

        with pytest.raises(DomainError):
            Chapter(id="ch_00", number=0, title="Test", text="Content")

    def test_imports_from_domain_module(self) -> None:
        """Test that entities can be imported from liriac.domain."""
        # This ensures the __init__.py re-exports work correctly
        from liriac.domain import Book, Chapter  # noqa: F401

        # Basic functionality should work the same
        book = Book(id="test", slug="test", title="Test")
        chapter = Chapter(id="ch_01", number=1, title="Test", text="Content")

        assert book.title == "Test"
        assert chapter.number == 1
