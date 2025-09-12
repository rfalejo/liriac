"""Domain layer for liriac.

This package contains the core business logic, entities, value objects,
and domain services that implement the novel writing assistance functionality.
"""

from .book import Book
from .chapter import Chapter
from .errors import (
    DomainError,
    InvariantViolation,
    ConcurrencyConflict,
    AppendRejected,
    SlugInvalid,
    ContextOverBudget,
)
from .stop_policy import StopPolicy
from .values import (
    BookId,
    ChapterId,
    Title,
    Markdown,
    TokenCount,
    Timestamp,
    book_id,
    make_chapter_id,
    parse_chapter_id,
    slug,
    title,
    markdown,
    token_count,
    timestamp,
)

__all__ = [
    "Book",
    "Chapter",
    "DomainError",
    "InvariantViolation",
    "ConcurrencyConflict",
    "AppendRejected",
    "SlugInvalid",
    "ContextOverBudget",
    "StopPolicy",
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
