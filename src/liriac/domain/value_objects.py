"""Immutable value objects for domain layer.

Value objects represent concepts that don't have identity but are defined by their attributes.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePosixPath

from .types import BookId, PersonaId


@dataclass(frozen=True)
class ChapterRef:
    """Reference to a chapter within a book.

    Immutable value object that identifies a chapter by its book and relative path.
    """

    book_id: BookId
    relative_path: PurePosixPath

    def __post_init__(self) -> None:
        """Validate ChapterRef invariants."""
        # Validate non-empty book_id
        if not self.book_id:
            raise ValueError("Book ID cannot be empty")

        # Validate relative path is actually relative
        if self.relative_path.is_absolute():
            raise ValueError(
                f"Chapter path must be relative, got absolute: {self.relative_path}"
            )

        # Validate path doesn't contain anchor references or up-level references
        if ".." in str(self.relative_path).split("/"):
            raise ValueError(
                f"Chapter path cannot contain up-level references, got: {self.relative_path}"
            )


@dataclass(frozen=True)
class PersonaRef:
    """Reference to a persona within a book.

    Immutable value object that identifies a persona by its book and persona ID.
    """

    book_id: BookId
    persona_id: PersonaId

    def __post_init__(self) -> None:
        """Validate PersonaRef invariants."""
        # Validate non-empty book_id
        if not self.book_id:
            raise ValueError("Book ID cannot be empty")

        # Validate non-empty persona_id
        if not self.persona_id:
            raise ValueError("Persona ID cannot be empty")


__all__ = [
    "ChapterRef",
    "PersonaRef",
]
