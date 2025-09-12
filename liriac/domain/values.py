"""Value objects and identifiers for liriac domain.

This module defines lightweight, validated value objects used throughout the domain.
All VOs are immutable where appropriate and raise domain-specific exceptions on invalid inputs.
"""

from __future__ import annotations

import re
from typing import NewType

from .errors import InvariantViolation, SlugInvalid

__all__ = [
    "BookId",
    "ChapterId",
    "Title",
    "Markdown",
    "TokenCount",
    "Timestamp",
    "book_id",
    "make_chapter_id",
    "parse_chapter_id",
    "slug",
    "title",
    "markdown",
    "token_count",
    "timestamp",
]

# Type aliases with NewType for type safety
BookId = NewType("BookId", str)
ChapterId = NewType("ChapterId", str)
Title = str  # Simple string type for MVP
Markdown = str  # Simple string type for MVP
TokenCount = NewType("TokenCount", int)
Timestamp = NewType("Timestamp", str)


def book_id(value: str) -> BookId:
    """Create a BookId from a string value.

    Args:
        value: String identifier for the book.

    Returns:
        BookId: NewType wrapper around the string.

    Note:
        Minimal validation in MVP - accepts any non-empty string.
    """
    if not value or not value.strip():
        raise InvariantViolation("BookId cannot be empty")
    return BookId(value.strip())


def make_chapter_id(number: int) -> ChapterId:
    """Create a zero-padded ChapterId from a number.

    Args:
        number: Chapter number (must be positive).

    Returns:
        ChapterId: Zero-padded string like "ch_01", "ch_12".

    Raises:
        InvariantViolation: If number is not positive.
    """
    if number <= 0:
        raise InvariantViolation(f"Chapter number must be positive, got {number}")
    return ChapterId(f"ch_{number:02d}")


def parse_chapter_id(value: str) -> tuple[int, ChapterId]:
    """Parse a ChapterId string and return both number and normalized id.

    Args:
        value: ChapterId string like "ch_01", "ch_12".

    Returns:
        Tuple of (chapter_number, normalized_chapter_id).

    Raises:
        InvariantViolation: If format is invalid.
    """
    if not value.startswith("ch_"):
        raise InvariantViolation(f"ChapterId '{value}' must start with 'ch_'")

    number_part = value[3:]  # Remove "ch_" prefix
    if not number_part.isdigit():
        raise InvariantViolation(f"ChapterId '{value}' must have numeric suffix")

    number = int(number_part)
    if number <= 0:
        raise InvariantViolation(f"ChapterId '{value}' must have positive number")

    # Ensure zero-padding for consistency
    normalized_id = make_chapter_id(number)
    return number, normalized_id


def slug(value: str) -> str:
    """Create and validate a slug value.

    Slugs must be lowercase, hyphenated, with no spaces or underscores.
    Allowed characters: [a-z0-9-]

    Args:
        value: Input string to validate as slug.

    Returns:
        str: Validated slug string.

    Raises:
        SlugInvalid: If slug format is invalid.
    """
    if not value:
        raise SlugInvalid("Slug cannot be empty")

    trimmed = value.strip()
    if not trimmed:
        raise SlugInvalid("Slug cannot be whitespace")

    # Check for valid characters: lowercase letters, digits, hyphens only
    if not re.fullmatch(r"[a-z0-9-]+", trimmed):
        raise SlugInvalid(
            f"Slug '{trimmed}' is invalid: must be lowercase-hyphenated (a-z, 0-9, - only)"
        )

    # Check no leading or trailing hyphens
    if trimmed.startswith("-") or trimmed.endswith("-"):
        raise SlugInvalid(
            f"Slug '{trimmed}' is invalid: cannot start or end with hyphen"
        )

    # Check no consecutive hyphens (optional but recommended)
    if "--" in trimmed:
        raise SlugInvalid(
            f"Slug '{trimmed}' is invalid: cannot contain consecutive hyphens"
        )

    # Practical length limit
    if len(trimmed) > 64:
        raise SlugInvalid(
            f"Slug '{trimmed[:20]}...' is invalid: exceeds maximum length of 64"
        )

    return trimmed


def title(value: str) -> str:
    """Create and validate a title value.

    Args:
        value: Input string for title.

    Returns:
        str: Trimmed, validated title string.

    Raises:
        InvariantViolation: If title is empty after trimming.
    """
    if not value:
        raise InvariantViolation("Title cannot be empty")

    trimmed = value.strip()
    if not trimmed:
        raise InvariantViolation("Title cannot be whitespace")

    # Optional: practical length limit
    if len(trimmed) > 200:
        raise InvariantViolation(
            f"Title '{trimmed[:30]}...' exceeds maximum length of 200"
        )

    return trimmed


def markdown(value: str) -> str:
    """Create a markdown text wrapper.

    Args:
        value: Markdown text content (can be empty).

    Returns:
        str: Same as input (wrapper semantics only).

    Raises:
        InvariantViolation: If value is None.
    """
    if value is None:
        raise InvariantViolation("Markdown cannot be None")
    return value


def token_count(value: int) -> TokenCount:
    """Create and validate a token count.

    Args:
        value: Number of tokens (non-negative integer).

    Returns:
        TokenCount: NewType wrapper for the count.

    Raises:
        InvariantViolation: If value is negative.
    """
    if value < 0:
        raise InvariantViolation(f"Token count cannot be negative, got {value}")
    return TokenCount(value)


def timestamp(value: str) -> Timestamp:
    """Create a timestamp value.

    Args:
        value: ISO-8601 timestamp string.

    Returns:
        Timestamp: NewType wrapper for the timestamp.

    Note:
        Domain treats timestamp as opaque string. Minimal validation in MVP.
    """
    if not value:
        raise InvariantViolation("Timestamp cannot be empty")
    trimmed = value.strip()
    if not trimmed:
        raise InvariantViolation("Timestamp cannot be empty")
    return Timestamp(trimmed)
