"""Book entity for Liriac domain.

A book represents a collection of chapters and personas with metadata.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import TYPE_CHECKING

from ..types import BookId
from ..value_objects import ChapterRef

if TYPE_CHECKING:
    from .persona import Persona


@dataclass(frozen=True)
class Book:
    """A book entity containing chapters and personas.

    Immutable domain entity that represents a complete book with metadata,
    chapters, and personas. All business invariants are enforced.
    """

    id: BookId
    title: str
    created_at: datetime
    chapters: tuple[ChapterRef, ...]
    personas: tuple[Persona, ...]

    def __post_init__(self) -> None:
        """Validate Book invariants."""
        # Validate non-empty title
        if not self.title or not self.title.strip():
            raise ValueError("Book title cannot be empty")

        # Validate timezone-aware datetime
        if self.created_at.tzinfo is None:
            raise ValueError("created_at must be timezone-aware")

        # Validate chapters tuple
        if not isinstance(self.chapters, tuple):
            raise TypeError("chapters must be a tuple")

        # Validate personas tuple
        if not isinstance(self.personas, tuple):
            raise TypeError("personas must be a tuple")

        # Strip title whitespace
        object.__setattr__(self, "title", self.title.strip())


__all__ = [
    "Book",
]
