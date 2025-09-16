"""Context management services for chapter and persona selection."""

from __future__ import annotations

from dataclasses import dataclass

from liriac.domain.types import PersonaRef
from liriac.domain.value_objects import ChapterRef


@dataclass(slots=True)
class SelectionState:
    """Manages selection state for chapters and personas with toggle functionality."""

    selected_chapters: set[ChapterRef]
    selected_personas: set[PersonaRef]

    def __init__(self) -> None:
        self.selected_chapters = set()
        self.selected_personas = set()

    def toggle_chapter(self, ref: ChapterRef) -> None:
        """Toggle the selection state of a chapter."""
        if ref in self.selected_chapters:
            self.selected_chapters.remove(ref)
        else:
            self.selected_chapters.add(ref)

    def toggle_persona(self, ref: PersonaRef) -> None:
        """Toggle the selection state of a persona."""
        if ref in self.selected_personas:
            self.selected_personas.remove(ref)
        else:
            self.selected_personas.add(ref)

    def clear(self) -> None:
        """Clear all selections."""
        self.selected_chapters.clear()
        self.selected_personas.clear()

    def snapshot(self) -> tuple[tuple[ChapterRef, ...], tuple[PersonaRef, ...]]:
        """Return immutable snapshot of current selections."""
        return (
            tuple(self.selected_chapters),
            tuple(self.selected_personas),
        )
