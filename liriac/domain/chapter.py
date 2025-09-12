"""Chapter entity for liriac domain.

This module defines the Chapter aggregate root with its business invariants
and domain operations.
"""

from __future__ import annotations

from dataclasses import dataclass

from .errors import InvariantViolation
from .stop_policy import StopPolicy
from .values import (
    ChapterId,
    make_chapter_id,
    parse_chapter_id,
    title,
    markdown,
)

__all__ = ["Chapter"]


@dataclass
class Chapter:
    """Chapter aggregate root.

    Represents a chapter with identity, number, title, and text content.
    Enforces business invariants around chapter numbering and identity.
    
    Validation and normalization are delegated to value helpers:
    - id: validated via parse_chapter_id() and normalized via make_chapter_id()
    - number: must be positive integer
    - title: trimmed and validated via title()
    - text: validated via markdown()
    """

    __slots__ = ("id", "number", "title", "text")

    id: ChapterId
    number: int
    title: str
    text: str

    def __post_init__(self) -> None:
        """Validate invariants after initialization."""
        # Validate number is positive
        if self.number <= 0:
            raise InvariantViolation(
                f"Chapter number must be positive, got {self.number}"
            )

        # Parse and validate chapter id consistency
        parsed_number, normalized_id = parse_chapter_id(self.id)
        if parsed_number != self.number:
            raise InvariantViolation(
                f"Chapter id '{self.id}' inconsistent with number {self.number}: "
                f"expected id '{normalized_id}'"
            )

        # Normalize to zero-padded format
        self.id = normalized_id

        # Validate and normalize title
        self.title = title(self.title)

        # Validate text content
        self.text = markdown(self.text)

    def retitle(self, new_title: str) -> None:
        """Update the chapter's title.

        Args:
            new_title: New title for the chapter.

        Raises:
            InvariantViolation: If title is invalid.
        """
        self.title = title(new_title)

    def renumber(self, new_number: int) -> None:
        """Update the chapter's number and id consistently.

        Args:
            new_number: New chapter number (must be positive).

        Raises:
            InvariantViolation: If number is not positive.
        """
        if new_number <= 0:
            raise InvariantViolation(
                f"Chapter number must be positive, got {new_number}"
            )

        self.number = new_number
        self.id = make_chapter_id(new_number)

    def append_text(self, delta: str, stop: StopPolicy) -> tuple["Chapter", tuple]:
        """Append AI-generated text to the chapter.
        
        This method enforces append-only behavior for AI-generated content.
        The delta is only added to the end of existing text; existing content
        cannot be modified through this method.
        
        Args:
            delta: Text content to append (validated as markdown).
            stop: Stop policy for generation tracking (not applied by domain).
            
        Returns:
            Tuple of (updated_chapter, events) where events is empty tuple in MVP.
            
        Raises:
            InvariantViolation: If delta is None.
            
        Note:
            StopPolicy is carried for contract symmetry and potential event recording.
            Actual stop sequence application is handled by adapters/providers.
        """
        validated_delta = markdown(delta)
        self.text = self.text + validated_delta
        return self, ()

    def apply_user_edit(self, full_text: str) -> tuple["Chapter", tuple]:
        """Apply a manual user edit to replace the entire chapter text.
        
        This method allows full text replacement for manual human edits,
        bypassing the append-only restriction that applies to AI generation.
        
        Args:
            full_text: New complete markdown text for the chapter.
            
        Returns:
            Tuple of (updated_chapter, events) where events is empty tuple in MVP.
            
        Raises:
            InvariantViolation: If full_text is None.
        """
        validated_text = markdown(full_text)
        self.text = validated_text
        return self, ()

    def replace_text(self, full_text: str) -> None:
        """Replace the entire chapter text.

        Note: Append-only behavior is enforced by dedicated operations
        in L-05, not by this general text replacement method.

        Args:
            full_text: New markdown text for the chapter.

        Raises:
            InvariantViolation: If text is None.
        """
        self.text = markdown(full_text)

    def __str__(self) -> str:
        """Return a concise string representation."""
        return f"Chapter(id='{self.id}', title='{self.title}')"

    def __repr__(self) -> str:
        """Return a detailed, constructor-like representation."""
        return (
            f"Chapter(id={self.id!r}, number={self.number!r}, "
            f"title={self.title!r}, text={self.text!r})"
        )
