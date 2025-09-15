from __future__ import annotations

"""In-memory history for per-chapter suggestions.

Keeps a bounded list of recent suggestions per ChapterRef.
"""

from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Deque, Dict, Tuple

from ...domain.entities.suggestion import Suggestion
from ...domain.value_objects import ChapterRef


@dataclass(slots=True)
class SuggestionsHistory:
    """Bounded in-memory history of suggestions per chapter.

    Maintains up to ``max_per_chapter`` suggestions (most recent) per ``ChapterRef``.
    """

    max_per_chapter: int = 10
    _by_ref: Dict[ChapterRef, Deque[Suggestion]] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        if self.max_per_chapter <= 0:
            raise ValueError("max_per_chapter must be > 0")
        # Internal mapping to bounded deques
        self._by_ref = defaultdict(lambda: deque(maxlen=self.max_per_chapter))

    def add(self, ref: ChapterRef, suggestion: Suggestion) -> None:
        self._by_ref[ref].append(suggestion)

    def get(self, ref: ChapterRef) -> Tuple[Suggestion, ...]:
        return tuple(self._by_ref.get(ref, ()))

    def clear(self, ref: ChapterRef) -> None:
        self._by_ref.pop(ref, None)

