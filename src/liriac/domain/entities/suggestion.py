"""Suggestion entity for Liriac domain.

A suggestion represents AI-generated or user-provided text suggestions.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..types import SuggestionId, SuggestionSource, SuggestionStatus


@dataclass(frozen=True)
class Suggestion:
    """A suggestion entity containing text suggestions.

    Immutable domain entity that represents a text suggestion with its
    source, creation time, and status. All business invariants are
    enforced.
    """

    id: SuggestionId
    text: str
    source: SuggestionSource
    created_at: datetime
    status: SuggestionStatus

    def __post_init__(self) -> None:
        """Validate Suggestion invariants."""
        # Validate non-empty text
        if not self.text or not self.text.strip():
            raise ValueError("Suggestion text cannot be empty")

        # Validate timezone-aware datetime
        if self.created_at.tzinfo is None:
            raise ValueError("created_at must be timezone-aware")

        # Strip text whitespace
        object.__setattr__(self, "text", self.text.strip())


__all__ = [
    "Suggestion",
]
