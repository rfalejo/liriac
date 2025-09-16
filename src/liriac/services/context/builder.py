"""Context building utilities for creating ContextProfile instances."""

from __future__ import annotations

from liriac.domain.types import ContextProfile, PersonaRef
from liriac.domain.value_objects import ChapterRef


def build_context(
    *,
    chapters: tuple[ChapterRef, ...],
    personas: tuple[PersonaRef, ...],
    system_prompt: str,
) -> ContextProfile:
    """Build an immutable ContextProfile from selected chapters, personas, and system prompt.

    Args:
        chapters: Tuple of selected chapter references
        personas: Tuple of selected persona references
        system_prompt: System prompt text

    Returns:
        Immutable ContextProfile instance
    """
    return ContextProfile(
        chapters=chapters,
        personas=personas,
        system_prompt=system_prompt,
    )
