"""Domain ports and protocols.

Defines typed interfaces (Protocol) for repository operations without IO implementation.
These protocols enable clean architecture by separating contracts from implementations.
"""

from __future__ import annotations

from pathlib import Path
from typing import Protocol

from .entities.book import Book
from .entities.chapter import Chapter
from .types import BookId
from .value_objects import ChapterRef


class LibraryRepository(Protocol):
    """Repository for library-level book operations.

    Protocol for discovering and loading books from a library location.
    All operations are pure type contracts; no IO is performed at the domain level.
    """

    def list_books(self, library_path: Path) -> tuple[BookId, ...]:
        """List all books available in the library.

        Args:
            library_path: Path to the library directory

        Returns:
            Tuple of Book IDs for valid books in the library

        Raises:
            OSError: If the library path cannot be accessed
        """
        ...

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
        ...


class ChapterRepository(Protocol):
    """Repository for chapter-level operations.

    Protocol for reading and writing individual chapter content.
    All operations are pure type contracts; no IO is performed at the domain level.
    """

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
        ...

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
        ...


__all__ = [
    "LibraryRepository",
    "ChapterRepository",
]
