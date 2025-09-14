"""Tests for filesystem repository implementation.

Tests cover library discovery, book loading, chapter read/write operations,
and error handling scenarios.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from typing import Any

import pytest

from liriac.domain.entities.chapter import Chapter
from liriac.domain.types import BookId, ChapterId
from liriac.domain.value_objects import ChapterRef
from liriac.infra.fs.library import FilesystemLibraryRepository


class TestFilesystemLibraryRepository:
    """Test suite for FilesystemLibraryRepository."""

    def test_list_books_empty_library(self, tmp_path: Path) -> None:
        """Test listing books in an empty library."""
        repo = FilesystemLibraryRepository()
        books = repo.list_books(tmp_path)
        assert books == ()

    def test_list_books_with_valid_books(self, tmp_path: Path) -> None:
        """Test listing books with valid book.toml files."""
        repo = FilesystemLibraryRepository()

        # Create valid book structure
        book1_dir = tmp_path / "book1"
        book1_dir.mkdir()
        (book1_dir / "book.toml").write_text(
            'title = "Book 1"\ncreated_at = "2024-01-01T00:00:00Z"\nchapters = []'
        )

        book2_dir = tmp_path / "book2"
        book2_dir.mkdir()
        (book2_dir / "book.toml").write_text(
            'title = "Book 2"\ncreated_at = "2024-01-02T00:00:00Z"\nchapters = []'
        )

        # Create invalid directory (no book.toml)
        invalid_dir = tmp_path / "invalid"
        invalid_dir.mkdir()

        books = repo.list_books(tmp_path)
        assert set(books) == {BookId("book1"), BookId("book2")}

    def test_list_books_nonexistent_library(self) -> None:
        """Test listing books from non-existent library path."""
        repo = FilesystemLibraryRepository()
        nonexistent = Path("/nonexistent/path")

        with pytest.raises(FileNotFoundError, match="Library path does not exist"):
            repo.list_books(nonexistent)

    def test_list_books_library_is_file(self, tmp_path: Path) -> None:
        """Test listing books when library path is a file."""
        repo = FilesystemLibraryRepository()
        file_path = tmp_path / "file.txt"
        file_path.write_text("not a directory")

        with pytest.raises(ValueError, match="Library path is not a directory"):
            repo.list_books(file_path)

    def test_load_book_success(self, tmp_path: Path) -> None:
        """Test successfully loading a book."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()

        # Create book.toml with valid data
        (book_dir / "book.toml").write_text(
            'title = "Test Book"\n'
            'created_at = "2024-01-01T12:00:00Z"\n'
            'chapters = ["chapters/01.md", "chapters/02.md"]'
        )

        book = repo.load_book(tmp_path, BookId("test-book"))

        assert book.id == BookId("test-book")
        assert book.title == "Test Book"
        assert book.created_at == datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
        assert len(book.chapters) == 2
        assert book.personas == ()

        # Check chapter references
        chapter1_ref = book.chapters[0]
        assert chapter1_ref.book_id == BookId("test-book")
        assert str(chapter1_ref.relative_path) == "chapters/01.md"

        chapter2_ref = book.chapters[1]
        assert chapter2_ref.book_id == BookId("test-book")
        assert str(chapter2_ref.relative_path) == "chapters/02.md"

    def test_load_book_missing_directory(self, tmp_path: Path) -> None:
        """Test loading book from missing directory."""
        repo = FilesystemLibraryRepository()

        with pytest.raises(FileNotFoundError, match="Book directory not found"):
            repo.load_book(tmp_path, BookId("missing"))

    def test_load_book_missing_metadata(self, tmp_path: Path) -> None:
        """Test loading book with missing book.toml."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()  # No book.toml

        with pytest.raises(FileNotFoundError, match="Book metadata not found"):
            repo.load_book(tmp_path, BookId("test-book"))

    def test_load_book_invalid_toml(self, tmp_path: Path) -> None:
        """Test loading book with invalid TOML."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()
        (book_dir / "book.toml").write_text("invalid toml [unclosed bracket")

        with pytest.raises(ValueError, match="Invalid TOML metadata"):
            repo.load_book(tmp_path, BookId("test-book"))

    def test_load_book_missing_title(self, tmp_path: Path) -> None:
        """Test loading book with missing title."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()
        (book_dir / "book.toml").write_text(
            'created_at = "2024-01-01T00:00:00Z"\nchapters = []'
        )

        with pytest.raises(ValueError, match="missing required 'title' field"):
            repo.load_book(tmp_path, BookId("test-book"))

    def test_load_book_missing_created_at(self, tmp_path: Path) -> None:
        """Test loading book with missing created_at."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()
        (book_dir / "book.toml").write_text('title = "Test Book"\nchapters = []')

        with pytest.raises(ValueError, match="missing required 'created_at' field"):
            repo.load_book(tmp_path, BookId("test-book"))

    def test_load_book_invalid_created_at(self, tmp_path: Path) -> None:
        """Test loading book with invalid created_at format."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()
        (book_dir / "book.toml").write_text(
            'title = "Test Book"\ncreated_at = "invalid-date"\nchapters = []'
        )

        with pytest.raises(ValueError, match="invalid 'created_at' format"):
            repo.load_book(tmp_path, BookId("test-book"))

    def test_load_book_naive_created_at_becomes_utc(self, tmp_path: Path) -> None:
        """Test that naive datetime becomes UTC."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()
        (book_dir / "book.toml").write_text(
            'title = "Test Book"\ncreated_at = "2024-01-01T12:00:00"\nchapters = []'
        )

        book = repo.load_book(tmp_path, BookId("test-book"))
        assert book.created_at == datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)

    def test_load_book_invalid_chapters_type(self, tmp_path: Path) -> None:
        """Test loading book with invalid chapters type."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()
        (book_dir / "book.toml").write_text(
            'title = "Test Book"\ncreated_at = "2024-01-01T00:00:00Z"\nchapters = "not-a-list"'
        )

        with pytest.raises(ValueError, match="'chapters' must be a list"):
            repo.load_book(tmp_path, BookId("test-book"))

    def test_load_book_absolute_chapter_path(self, tmp_path: Path) -> None:
        """Test loading book with absolute chapter path."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()
        (book_dir / "book.toml").write_text(
            'title = "Test Book"\ncreated_at = "2024-01-01T00:00:00Z"\n'
            'chapters = ["/absolute/path.md"]'
        )

        with pytest.raises(ValueError, match="Chapter path must be relative"):
            repo.load_book(tmp_path, BookId("test-book"))

    def test_load_book_uplevel_chapter_path(self, tmp_path: Path) -> None:
        """Test loading book with up-level chapter path."""
        repo = FilesystemLibraryRepository()
        book_dir = tmp_path / "test-book"
        book_dir.mkdir()
        (book_dir / "book.toml").write_text(
            'title = "Test Book"\ncreated_at = "2024-01-01T00:00:00Z"\n'
            'chapters = ["../outside.md"]'
        )

        with pytest.raises(ValueError, match="cannot contain up-level references"):
            repo.load_book(tmp_path, BookId("test-book"))

    def test_read_chapter_success(self, tmp_path: Path) -> None:
        """Test successfully reading a chapter."""
        repo = FilesystemLibraryRepository()

        # Create test chapter file
        book_dir = tmp_path / "test-book"
        book_dir.mkdir(parents=True)
        chapter_dir = book_dir / "chapters"
        chapter_dir.mkdir()
        chapter_file = chapter_dir / "01.md"
        chapter_file.write_text("This is chapter content")

        # Create chapter reference
        ref = ChapterRef(
            book_id=BookId("test-book"), relative_path=PurePosixPath("chapters/01.md")
        )

        chapter = repo.read_chapter(tmp_path, ref)

        assert chapter.id == ChapterId("01")
        assert chapter.title == "01"
        assert chapter.text == "This is chapter content"
        assert chapter.ref == ref
        assert chapter.updated_at.tzinfo is not None  # Should be timezone-aware

    def test_read_chapter_missing_file(self, tmp_path: Path) -> None:
        """Test reading missing chapter file."""
        repo = FilesystemLibraryRepository()

        ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapters/missing.md"),
        )

        with pytest.raises(FileNotFoundError, match="Chapter file not found"):
            repo.read_chapter(tmp_path, ref)

    def test_read_chapter_path_is_directory(self, tmp_path: Path) -> None:
        """Test reading when chapter path is a directory."""
        repo = FilesystemLibraryRepository()

        # Create directory instead of file
        book_dir = tmp_path / "test-book"
        book_dir.mkdir(parents=True)
        chapter_dir = book_dir / "chapters"
        chapter_dir.mkdir()

        ref = ChapterRef(
            book_id=BookId("test-book"), relative_path=PurePosixPath("chapters")
        )

        with pytest.raises(ValueError, match="Chapter path is not a file"):
            repo.read_chapter(tmp_path, ref)

    def test_read_chapter_invalid_utf8(self, tmp_path: Path) -> None:
        """Test reading chapter with invalid UTF-8."""
        repo = FilesystemLibraryRepository()

        # Create chapter file with invalid UTF-8
        book_dir = tmp_path / "test-book"
        book_dir.mkdir(parents=True)
        chapter_dir = book_dir / "chapters"
        chapter_dir.mkdir()
        chapter_file = chapter_dir / "01.md"
        chapter_file.write_bytes(b"Invalid UTF-8: \xff\xfe")

        ref = ChapterRef(
            book_id=BookId("test-book"), relative_path=PurePosixPath("chapters/01.md")
        )

        with pytest.raises(ValueError, match="not valid UTF-8"):
            repo.read_chapter(tmp_path, ref)

    def test_write_chapter_success(self, tmp_path: Path) -> None:
        """Test successfully writing a chapter."""
        repo = FilesystemLibraryRepository()

        # Create chapter entity
        ref = ChapterRef(
            book_id=BookId("test-book"), relative_path=PurePosixPath("chapters/01.md")
        )
        chapter = Chapter(
            id=ChapterId("01"),
            title="01",
            ref=ref,
            text="This is chapter content",
            updated_at=datetime.now(UTC),
        )

        repo.write_chapter(tmp_path, chapter)

        # Verify file was created
        chapter_file = tmp_path / "test-book" / "chapters" / "01.md"
        assert chapter_file.exists()
        assert (
            chapter_file.read_text() == "This is chapter content\n"
        )  # Should have trailing newline

        # Verify .liriac directory was created
        liriac_dir = tmp_path / "test-book" / ".liriac"
        assert liriac_dir.exists()
        assert (liriac_dir / "suggestions").exists()
        assert (liriac_dir / "versions").exists()

    def test_write_chapter_existing_content(self, tmp_path: Path) -> None:
        """Test writing chapter to existing file."""
        repo = FilesystemLibraryRepository()

        # Create existing file
        book_dir = tmp_path / "test-book"
        book_dir.mkdir(parents=True)
        chapter_dir = book_dir / "chapters"
        chapter_dir.mkdir()
        chapter_file = chapter_dir / "01.md"
        chapter_file.write_text("Old content")

        ref = ChapterRef(
            book_id=BookId("test-book"), relative_path=PurePosixPath("chapters/01.md")
        )
        chapter = Chapter(
            id=ChapterId("01"),
            title="01",
            ref=ref,
            text="New content",
            updated_at=datetime.now(UTC),
        )

        repo.write_chapter(tmp_path, chapter)

        # Verify content was updated
        assert chapter_file.read_text() == "New content\n"

    def test_write_chapter_content_with_trailing_newline(self, tmp_path: Path) -> None:
        """Test writing chapter that already has trailing newline."""
        repo = FilesystemLibraryRepository()

        ref = ChapterRef(
            book_id=BookId("test-book"), relative_path=PurePosixPath("chapters/01.md")
        )
        chapter = Chapter(
            id=ChapterId("01"),
            title="01",
            ref=ref,
            text="Content with newline\n",
            updated_at=datetime.now(UTC),
        )

        repo.write_chapter(tmp_path, chapter)

        chapter_file = tmp_path / "test-book" / "chapters" / "01.md"
        assert (
            chapter_file.read_text() == "Content with newline\n"
        )  # Should not double the newline

    def test_write_chapter_atomic_operation(self, tmp_path: Path) -> None:
        """Test that chapter write is atomic (no leftover temp files)."""
        repo = FilesystemLibraryRepository()

        ref = ChapterRef(
            book_id=BookId("test-book"), relative_path=PurePosixPath("chapters/01.md")
        )
        chapter = Chapter(
            id=ChapterId("01"),
            title="01",
            ref=ref,
            text="Test content",
            updated_at=datetime.now(UTC),
        )

        repo.write_chapter(tmp_path, chapter)

        # Verify no temp files remain
        book_dir = tmp_path / "test-book" / "chapters"
        temp_files = list(book_dir.glob("*.tmp"))
        assert len(temp_files) == 0

        # Verify final file exists
        final_file = book_dir / "01.md"
        assert final_file.exists()
        assert final_file.read_text() == "Test content\n"

    @pytest.fixture
    def sample_book_data(self) -> dict[str, Any]:
        """Sample book data for testing."""
        return {
            "title": "Test Book",
            "created_at": "2024-01-01T12:00:00Z",
            "chapters": ["chapters/01.md", "chapters/02.md"],
        }
