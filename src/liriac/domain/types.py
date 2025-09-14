"""Core domain types and identifiers.

Defines strongly typed identifiers and enumerations for the domain layer.
"""

from typing import Literal, NewType

# Entity identifiers
BookId = NewType("BookId", str)
ChapterId = NewType("ChapterId", str)
PersonaId = NewType("PersonaId", str)
SuggestionId = NewType("SuggestionId", str)

# Suggestion status
SuggestionStatus = Literal["pending", "accepted", "rejected"]

# Suggestion source
SuggestionSource = Literal["ai", "user"]

__all__ = [
    "BookId",
    "ChapterId",
    "PersonaId",
    "SuggestionId",
    "SuggestionStatus",
    "SuggestionSource",
]
