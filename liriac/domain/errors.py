"""Domain-specific exception hierarchy for liriac.

This module defines a cohesive set of domain-level exceptions that are easy to raise,
catch, and map to user-facing messages without leaking provider or infrastructure concerns.
"""

from __future__ import annotations

__all__ = [
    "DomainError",
    "InvariantViolation",
    "ConcurrencyConflict",
    "AppendRejected",
    "SlugInvalid",
    "ContextOverBudget",
]


class DomainError(Exception):
    """Base class for all domain-level exceptions in liriac.

    Domain errors represent business logic violations or semantic failures
    that occur during domain operations. They do not include technical
    concerns like network issues or file system errors.
    """

    message: str

    def __init__(self, message: str) -> None:
        """Initialize with a concise, human-readable message.

        Args:
            message: Description of what went wrong, including key identifiers
                     when useful for diagnostics.
        """
        super().__init__(message)
        self.message = message

    def __str__(self) -> str:
        """Return the human-readable message."""
        return self.message


class InvariantViolation(DomainError):
    """Raised when an entity or value object invariant is violated.

    This covers violations of business rules and constraints that should
    never occur with valid inputs, such as negative token counts or
    invalid title formats.
    """

    pass


class ConcurrencyConflict(DomainError):
    """Raised when a write would conflict with concurrent changes.

    This occurs when optimistic concurrency control detects that the
    entity being modified has been changed by another process since
    it was read.
    """

    pass


class AppendRejected(DomainError):
    """Raised when a non-append modification is attempted on a chapter.

    Chapter entities enforce an append-only policy for AI-generated content.
    This exception is raised when AI attempts to modify existing text
    rather than appending new content.
    """

    pass


class SlugInvalid(InvariantViolation):
    """Raised when a slug fails validation.

    Slugs must follow specific formatting rules (lowercase, hyphenated,
    no spaces, etc.). This specialized exception provides user-actionable
    guidance for slug validation failures.
    """

    pass


class ContextOverBudget(DomainError):
    """Raised when context planning exceeds the token budget.

    This occurs when the assembled context (metadata, characters, world info,
    previous chapters, etc.) exceeds the configured token budget. Can be
    raised in strict mode or surfaced as a return value otherwise.
    """

    pass
