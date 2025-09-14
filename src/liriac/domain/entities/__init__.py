"""Domain entities for Liriac application.

Pure domain entities with enforced invariants and no IO dependencies.
All entities are immutable frozen dataclasses.
"""

from .book import Book
from .chapter import Chapter
from .persona import Persona
from .suggestion import Suggestion

__all__ = [
    "Book",
    "Chapter",
    "Persona",
    "Suggestion",
]
