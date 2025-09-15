from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator, Optional
import uuid

from ...domain.entities.suggestion import Suggestion
from ...domain.ports import AIProvider
from ...domain.types import AISettings, ContextProfile, StreamEvent, SuggestionId
from ...domain.value_objects import ChapterRef
from .history import SuggestionsHistory
from .acceptance import merge_text, write_log


class SuggestionsService:
    """Orchestrates AI suggestions generation, history, and acceptance.

    Side effects are limited to writing log files on accept().
    """

    def __init__(
        self,
        provider: AIProvider,
        *,
        base_dir: Path,
        history: Optional[SuggestionsHistory] = None,
    ) -> None:
        self._provider = provider
        self._history = history or SuggestionsHistory()
        self._base_dir = base_dir

    async def generate(
        self,
        *,
        prompt: str,
        settings: AISettings,
        context: Optional[ContextProfile],
        ref: ChapterRef,
    ) -> AsyncIterator[StreamEvent]:
        """Stream suggestion deltas and record the final suggestion in history.

        Yields incoming StreamEvent values to the caller.
        """
        buffer: list[str] = []
        async for event in self._provider.stream(
            prompt=prompt, settings=settings, context=context
        ):
            if event.delta:
                buffer.append(event.delta)
            yield event
            if event.done:
                text = "".join(buffer).strip()
                if text:
                    sug = Suggestion(
                        id=SuggestionId(str(uuid.uuid4())),
                        text=text,
                        source="ai",
                        created_at=datetime.now(timezone.utc),
                        status="pending",
                    )
                    self._history.add(ref, sug)

    def regenerate(self, ref: ChapterRef) -> None:
        """Prepare state for a new suggestion cycle for the same chapter.

        No persistent state is kept between generations currently, so this is a no-op.
        """
        return None

    def get_history(self, ref: ChapterRef) -> tuple[Suggestion, ...]:
        return self._history.get(ref)

    def accept(self, *, ref: ChapterRef, base_text: str, index: int) -> str:
        """Accept a suggestion by index, merge text, and log entry.

        Returns the merged chapter text.
        """
        history = self._history.get(ref)
        if not history:
            raise IndexError("no suggestions for chapter")
        if index < 0 or index >= len(history):
            raise IndexError("suggestion index out of range")

        suggestion = history[index]
        merged = merge_text(base_text, suggestion.text)
        write_log(self._base_dir, ref, suggestion, datetime.now(timezone.utc))
        return merged
