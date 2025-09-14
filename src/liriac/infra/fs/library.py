"""Filesystem repository implementation for library and chapter operations.

Implements the LibraryRepository and ChapterRepository protocols for
local filesystem storage. Uses atomic writes, content hashing, and
safe file operations to prevent data loss and corruption.
"""

from __future__ import annotations

import os
import tempfile
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from typing import Final

from ...domain.entities.book import Book
from ...domain.entities.chapter import Chapter
from ...domain.ports import ChapterRepository, LibraryRepository
from ...domain.types import BookId, ChapterId
from ...domain.value_objects import ChapterRef


class FilesystemLibraryRepository(LibraryRepository, ChapterRepository):
    """Concrete filesystem implementation of library and chapter repositories.

    Implements book discovery, loading, and chapter read/write operations using
    the local filesystem. Ensures atomic writes and data integrity.
    """

    # Configuration constants
    _BOOK_METADATA_FILE: Final[str] = "book.toml"
    _LIRIAC_DIR: Final[str] = ".liriac"
    _SUGGESTIONS_DIR: Final[str] = "suggestions"
    _VERSIONS_DIR: Final[str] = "versions"

    def list_books(self, library_path: Path) -> tuple[BookId, ...]:
        """List all books available in the library.

        Args:
            library_path: Path to the library directory

        Returns:
            Tuple of Book IDs for valid books in the library

        Raises:
            OSError: If the library path cannot be accessed
        """
        if not library_path.exists():
            raise FileNotFoundError(f"Library path does not exist: {library_path}")

        if not library_path.is_dir():
            raise ValueError(f"Library path is not a directory: {library_path}")

        book_ids = []
        for entry in library_path.iterdir():
            if entry.is_dir():
                book_meta_path = entry / self._BOOK_METADATA_FILE
                if book_meta_path.exists() and book_meta_path.is_file():
                    book_ids.append(BookId(entry.name))

        return tuple(book_ids)

    def load_book(self, library_path: Path, book_id: BookId) -> Book:
        """Load a complete book entity from the library.

        Args:
            library_path: Path to the library directory
            book_id: ID of the book to load

        Returns:
            Complete Book entity with chapters and personas

        Raises:
            FileNotFoundError: If the book or its metadata cannot be found
            ValueError: If the book metadata is invalid or malformed
        """
        book_dir = library_path / book_id
        book_meta_path = book_dir / self._BOOK_METADATA_FILE

        if not book_dir.exists():
            raise FileNotFoundError(f"Book directory not found: {book_dir}")

        if not book_meta_path.exists():
            raise FileNotFoundError(f"Book metadata not found: {book_meta_path}")

        # Parse TOML metadata
        import tomllib

        try:
            with book_meta_path.open("rb") as f:
                metadata = tomllib.load(f)
        except Exception as e:
            raise ValueError(f"Invalid TOML metadata for book {book_id}: {e}") from e

        # Extract required fields
        title = metadata.get("title")
        if not title or not isinstance(title, str):
            raise ValueError(f"Book {book_id} missing required 'title' field")

        created_at_str = metadata.get("created_at")
        if not created_at_str or not isinstance(created_at_str, str):
            raise ValueError(f"Book {book_id} missing required 'created_at' field")

        # Parse created_at datetime with timezone awareness
        try:
            created_at = datetime.fromisoformat(created_at_str)
            if created_at.tzinfo is None:
                # Treat naive datetime as UTC
                created_at = created_at.replace(tzinfo=UTC)
        except ValueError as e:
            raise ValueError(
                f"Book {book_id} has invalid 'created_at' format: {e}"
            ) from e

        # Parse chapters list
        chapters_list = metadata.get("chapters", [])
        if not isinstance(chapters_list, list):
            raise ValueError(f"Book {book_id} 'chapters' must be a list")

        # Convert chapter paths to ChapterRef objects
        chapter_refs = []
        for chapter_path in chapters_list:
            if not isinstance(chapter_path, str):
                raise ValueError(
                    f"Book {book_id} chapter path must be string, got {type(chapter_path)}"
                )

            try:
                relative_path = Path(chapter_path)
                # Validate path is relative and doesn't contain up-level references
                if relative_path.is_absolute():
                    raise ValueError(f"Chapter path must be relative: {chapter_path}")

                if ".." in relative_path.parts:
                    raise ValueError(
                        f"Chapter path cannot contain up-level references: {chapter_path}"
                    )

                # Convert to PurePosixPath for cross-platform consistency
                chapter_ref = ChapterRef(
                    book_id=book_id, relative_path=PurePosixPath(chapter_path)
                )
                chapter_refs.append(chapter_ref)
            except ValueError as e:
                raise ValueError(
                    f"Book {book_id} has invalid chapter path '{chapter_path}': {e}"
                ) from e

        return Book(
            id=book_id,
            title=title,
            created_at=created_at,
            chapters=tuple(chapter_refs),
            personas=(),  # Empty for now, as specified in ticket
        )

    def read_chapter(self, library_path: Path, ref: ChapterRef) -> Chapter:
        """Read a chapter entity from the filesystem.

        Args:
            library_path: Path to the library directory
            ref: Chapter reference identifying the book and chapter

        Returns:
            Chapter entity with text content and metadata

        Raises:
            FileNotFoundError: If the chapter file cannot be found
            OSError: If the chapter file cannot be read
        """
        # Resolve chapter file path
        book_dir = library_path / ref.book_id
        chapter_file = book_dir / ref.relative_path

        if not chapter_file.exists():
            raise FileNotFoundError(f"Chapter file not found: {chapter_file}")

        if not chapter_file.is_file():
            raise ValueError(f"Chapter path is not a file: {chapter_file}")

        # Read file content
        try:
            text = chapter_file.read_text(encoding="utf-8")
        except UnicodeDecodeError as e:
            raise ValueError(f"Chapter file is not valid UTF-8: {chapter_file}") from e

        # Get file modification time as updated_at
        stat = chapter_file.stat()
        updated_at = datetime.fromtimestamp(stat.st_mtime, tz=UTC)

        # Extract chapter ID from filename stem
        chapter_id = ChapterId(chapter_file.stem)
        title = chapter_file.stem  # Use filename as title

        return Chapter(
            id=chapter_id, title=title, ref=ref, text=text, updated_at=updated_at
        )

    def write_chapter(self, library_path: Path, chapter: Chapter) -> None:
        """Write a chapter entity to the filesystem.

        Args:
            library_path: Path to the library directory
            chapter: Chapter entity to persist

        Returns:
            None

        Raises:
            OSError: If the chapter file cannot be written
        """
        # Resolve chapter file path
        book_dir = library_path / chapter.ref.book_id
        chapter_file = book_dir / chapter.ref.relative_path

        # Ensure parent directory exists
        chapter_file.parent.mkdir(parents=True, exist_ok=True)

        # Ensure .liriac directory structure exists (lazily)
        liriac_dir = book_dir / self._LIRIAC_DIR
        (liriac_dir / self._SUGGESTIONS_DIR).mkdir(parents=True, exist_ok=True)
        (liriac_dir / self._VERSIONS_DIR).mkdir(parents=True, exist_ok=True)

        # Write content atomically
        temp_dir = chapter_file.parent
        try:
            # Create temp file in same directory for atomic rename
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", dir=temp_dir, suffix=".tmp", delete=False
            ) as temp_file:
                # Write content with proper line endings
                temp_file.write(chapter.text)

                # Ensure trailing newline if content doesn't have one
                if not chapter.text.endswith("\n"):
                    temp_file.write("\n")

                temp_file.flush()
                temp_name = temp_file.name

            # Atomic replace
            os.replace(temp_name, chapter_file)

        except Exception as e:
            # Clean up temp file if write failed
            if "temp_name" in locals() and Path(temp_name).exists():
                try:
                    Path(temp_name).unlink()
                except OSError:
                    pass  # Don't fail cleanup
            raise OSError(f"Failed to write chapter file {chapter_file}: {e}") from e

    def _ensure_liriac_structure(self, book_dir: Path) -> None:
        """Ensure .liriac directory structure exists in book directory.

        Args:
            book_dir: Path to the book directory
        """
        liriac_dir = book_dir / self._LIRIAC_DIR
        liriac_dir.mkdir(exist_ok=True)

        (liriac_dir / self._SUGGESTIONS_DIR).mkdir(exist_ok=True)
        (liriac_dir / self._VERSIONS_DIR).mkdir(exist_ok=True)


__all__ = [
    "FilesystemLibraryRepository",
]
