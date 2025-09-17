"""Mock provider producing a predefined sequence of events for tests.

The mock provider is deterministic and supports cooperative cancellation. It
can be configured with a list of text chunks and an optional usage summary.
"""
from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Sequence

from .base import (
    AIProvider,
    CancelToken,
    DeltaEvent,
    DoneEvent,
    ErrorEvent,
    ProviderContext,
    ProviderEvent,
    ProviderSettings,
    UsageEvent,
)


class MockProvider(AIProvider):
    def __init__(
        self,
        *,
        chunks: Sequence[str] = ("Hello world",),
        delay_s: float = 0.0,
        usage: tuple[int, int] | None = (10, 5),
        error: str | None = None,
    ) -> None:
        self._chunks = list(chunks)
        self._delay_s = delay_s
        self._usage = usage
        self._error = error

    def stream(
        self,
        *,
        prompt: str,
        settings: ProviderSettings,
        context: ProviderContext,
        cancel: CancelToken,
    ) -> AsyncIterator[ProviderEvent]:  # pragma: no cover - exercised via service tests
        async def _gen() -> AsyncIterator[ProviderEvent]:
            for ch in self._chunks:
                await cancel.raise_if_cancelled()
                if self._delay_s:
                    await asyncio.sleep(self._delay_s)
                yield DeltaEvent(value=ch)
            await cancel.raise_if_cancelled()
            if self._error:
                yield ErrorEvent(message=self._error)
                return
            if self._usage is not None:
                pt, ct = self._usage
                yield UsageEvent(prompt_tokens=pt, completion_tokens=ct, total_tokens=pt + ct)
            yield DoneEvent()

        return _gen()


__all__ = ["MockProvider"]
