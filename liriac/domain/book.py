"""Book entity for liriac domain.

This module defines the Book aggregate root with its business invariants
and domain operations.
"""

from __future__ import annotations

from dataclasses import dataclass

from .values import BookId, book_id, slug, title

__all__ = ["Book"]


@dataclass
class Book:
    """Book aggregate root.

    Represents a book with identity, slug, and title.
    Additional metadata fields may be added in future iterations.
    
    Validation and normalization are delegated to value helpers:
    - id: normalized via book_id()
    - slug: validated via slug() 
    - title: trimmed and validated via title()
    """

    __slots__ = ("id", "slug", "title")

    id: BookId
    slug: str
    title: str

    def __post_init__(self) -> None:
        """Validate invariants after initialization."""
        # Validate and normalize id
        self.id = book_id(self.id)

        # Validate and normalize slug
        self.slug = slug(self.slug)

        # Validate and normalize title
        self.title = title(self.title)

    def retitle(self, new_title: str) -> None:
        """Update the book's title.

        Args:
            new_title: New title for the book.

        Raises:
            InvariantViolation: If title is invalid.
        """
        self.title = title(new_title)

    def reslug(self, new_slug: str) -> None:
        """Update the book's slug.

        Args:
            new_slug: New slug for the book.

        Raises:
            SlugInvalid: If slug format is invalid.
        """
        self.slug = slug(new_slug)

    def __str__(self) -> str:
        """Return a concise string representation."""
        return f"Book(slug='{self.slug}', title='{self.title}')"

    def __repr__(self) -> str:
        """Return a detailed, constructor-like representation."""
        return f"Book(id={self.id!r}, slug={self.slug!r}, title={self.title!r})"
