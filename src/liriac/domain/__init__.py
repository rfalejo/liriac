"""Domain layer for Liriac application.

This module contains pure domain entities and rules with no IO dependencies.
All entities are immutable and enforce business invariants.
"""

from .entities import Book, Chapter, Persona, Suggestion
from .types import (
    BookId,
    ChapterId,
    PersonaId,
    SuggestionId,
    SuggestionSource,
    SuggestionStatus,
)
from .value_objects import ChapterRef, PersonaRef

__all__ = [
    # Types
    "BookId",
    "ChapterId",
    "PersonaId",
    "SuggestionId",
    "SuggestionSource",
    "SuggestionStatus",
    # Value Objects
    "ChapterRef",
    "PersonaRef",
    # Entities
    "Book",
    "Chapter",
    "Persona",
    "Suggestion",
]
