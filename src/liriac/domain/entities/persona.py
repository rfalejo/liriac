"""Persona entity for Liriac domain.

A persona represents a character or entity within a book's world.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..types import PersonaId


@dataclass(frozen=True)
class Persona:
    """A persona entity representing a character or entity.

    Immutable domain entity that represents a character or entity with
    optional role, notes, and enabled/disabled state. All business
    invariants are enforced.
    """

    id: PersonaId
    name: str
    role: str | None
    notes: str | None
    enabled: bool

    def __post_init__(self) -> None:
        """Validate Persona invariants."""
        # Validate non-empty name
        if not self.name or not self.name.strip():
            raise ValueError("Persona name cannot be empty")

        # Strip whitespace from name and role
        object.__setattr__(self, "name", self.name.strip())
        if self.role is not None:
            object.__setattr__(self, "role", self.role.strip())
        if self.notes is not None:
            object.__setattr__(self, "notes", self.notes.strip())


__all__ = [
    "Persona",
]
