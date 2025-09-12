"""StopPolicy value object for liriac domain.

This module defines an immutable StopPolicy value object that validates
a bounded set of stop sequences used to terminate AI generation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .errors import InvariantViolation

__all__ = ["StopPolicy"]

# Policy bounds as defined in the ticket
_MAX_SEQUENCES_COUNT = 8
_MAX_SEQUENCES_LENGTH = 128


@dataclass(frozen=True)
class StopPolicy:
    """Immutable value object defining stop sequences for AI generation.

    StopPolicy contains ordered sequences that signal when AI generation
    should terminate. Each sequence is validated to ensure it's non-empty,
    reasonably sized, and contains only string types.

    Duplicate sequences are preserved in the order they appear (no automatic deduplication).
    Whitespace-only sequences (e.g., "\n\n") are preserved exactly, while sequences
    with non-whitespace content have external whitespace trimmed.

    Attributes:
        sequences: Tuple of stop sequences in order of priority.
    """

    sequences: tuple[str, ...]

    def __post_init__(self) -> None:
        """Validate invariants after construction."""
        if not self.sequences:
            raise InvariantViolation(
                "StopPolicy must include at least 1 sequence (got 0)"
            )

        if len(self.sequences) > _MAX_SEQUENCES_COUNT:
            raise InvariantViolation(
                f"StopPolicy allows at most {_MAX_SEQUENCES_COUNT} sequences (got {len(self.sequences)})"
            )

        for seq in self.sequences:
            # The sequences should already be trimmed strings
            if not isinstance(seq, str):
                raise InvariantViolation(
                    f"Stop sequence must be a string (got {type(seq).__name__})"
                )

            if not seq:
                raise InvariantViolation(
                    "Stop sequence cannot be empty (minimum length: 1)"
                )

            if len(seq) > _MAX_SEQUENCES_LENGTH:
                raise InvariantViolation(
                    f"Stop sequence exceeds maximum length {_MAX_SEQUENCES_LENGTH} (got {len(seq)})"
                )

    @classmethod
    def from_sequences(cls, sequences: Iterable[str]) -> StopPolicy:
        """Create a StopPolicy from an iterable of sequences.

        Args:
            sequences: Iterable of stop sequences to include.

        Returns:
            StopPolicy: Validated policy with normalized sequences.

        Raises:
            InvariantViolation: If any sequence is invalid.
        """
        # Convert to list to handle iterables and enable processing
        sequence_list = list(sequences)
        
        # Normalize each sequence by trimming whitespace
        normalized = []
        for seq in sequence_list:
            if not isinstance(seq, str):
                raise InvariantViolation(
                    f"Stop sequence must be a string (got {type(seq).__name__})"
                )
            # Check if the sequence is completely empty (no characters at all)
            if len(seq) == 0:
                raise InvariantViolation(
                    "Stop sequence cannot be empty (minimum length: 1)"
                )
            
            # For length validation, use the original sequence to preserve whitespace
            if len(seq) > _MAX_SEQUENCES_LENGTH:
                raise InvariantViolation(
                    f"Stop sequence exceeds maximum length {_MAX_SEQUENCES_LENGTH} (got {len(seq)})"
                )
            
            # For storage, trim external whitespace from non-whitespace sequences,
            # but preserve whitespace-only sequences as-is
            if seq.strip():
                normalized.append(seq.strip())
            else:
                normalized.append(seq)
        
        return cls(sequences=tuple(normalized))

    def __str__(self) -> str:
        """Return a readable representation."""
        if len(self.sequences) == 1:
            return f"StopPolicy[{self.sequences[0]!r}]"
        return f"StopPolicy{tuple(self.sequences)}"

    def __repr__(self) -> str:
        """Return a precise representation."""
        return f"StopPolicy(sequences={self.sequences!r})"