"""Core domain types and identifiers.

Defines strongly typed identifiers and enumerations for the domain layer.
"""

from __future__ import annotations

from dataclasses import dataclass
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


# --- AI Streaming related types ---
@dataclass(frozen=True)
class AISettings:
    """AI call settings provided per request.

    Fields may be left as None to fall back to application defaults.
    """

    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None


@dataclass(frozen=True)
class Tokens:
    """Token usage accounting information."""

    prompt: int | None = None
    completion: int | None = None
    total: int | None = None


@dataclass(frozen=True)
class StreamEvent:
    """Unified streaming event emitted by AI providers.

    - delta: text fragment, when available
    - usage: optional token usage, typically at the end
    - done: True to indicate end-of-stream
    - error: terminal error description, if any
    """

    delta: str | None = None
    usage: Tokens | None = None
    done: bool = False
    error: str | None = None


# Minimal ContextProfile for type safety; will be expanded in future tickets.
@dataclass(frozen=True)
class ContextProfile:
    """Context to guide AI generation (selected chapters/personas, system prompt)."""

    system_prompt: str = ""


__all__ = [
    "BookId",
    "ChapterId",
    "PersonaId",
    "SuggestionId",
    "SuggestionStatus",
    "SuggestionSource",
    # AI types
    "AISettings",
    "Tokens",
    "StreamEvent",
    "ContextProfile",
]
