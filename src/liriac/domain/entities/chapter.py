"""Chapter entity for Liriac domain.

A chapter represents a single chapter within a book with content.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..types import ChapterId
from ..value_objects import ChapterRef


@dataclass(frozen=True)
class Chapter:
    """A chapter entity containing text content.

    Immutable domain entity that represents a single chapter with its
    reference to the book, content, and metadata. All business invariants
    are enforced.
    """

    id: ChapterId
    title: str
    ref: ChapterRef
    text: str
    updated_at: datetime

    def __post_init__(self) -> None:
        """Validate Chapter invariants."""
        # Validate non-empty title
        if not self.title or not self.title.strip():
            raise ValueError("Chapter title cannot be empty")

        # Validate timezone-aware datetime
        if self.updated_at.tzinfo is None:
            raise ValueError("updated_at must be timezone-aware")

        # Strip title whitespace
        object.__setattr__(self, "title", self.title.strip())


__all__ = [
    "Chapter",
]
