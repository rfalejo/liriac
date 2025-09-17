"""Base provider interfaces and event types for suggestions streaming.

This module defines strongly-typed Protocols and dataclasses used by the
suggestions streaming service (BL-007). It is internal implementation detail
for now (no direct REST exposure yet).
"""
from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterable
from dataclasses import dataclass
from typing import Literal, Protocol, runtime_checkable

DeltaEventType = Literal["delta"]
UsageEventType = Literal["usage"]
DoneEventType = Literal["done"]
ErrorEventType = Literal["error"]

ProviderEventType = DeltaEventType | UsageEventType | DoneEventType | ErrorEventType


@dataclass(slots=True)
class ProviderSettings:
    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int | None = None
    stop: list[str] | None = None
    timeout_s: int = 120


@dataclass(slots=True)
class ProviderContext:
    system_prompt: str = ""
    personas: list[str] | None = None
    chapter_titles: list[str] | None = None


@dataclass(slots=True)
class DeltaEvent:
    type: Literal["delta"] = "delta"
    value: str = ""


@dataclass(slots=True)
class UsageEvent:
    type: Literal["usage"] = "usage"
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


@dataclass(slots=True)
class DoneEvent:
    type: Literal["done"] = "done"


@dataclass(slots=True)
class ErrorEvent:
    type: Literal["error"] = "error"
    message: str = ""
    code: str | None = None
    retryable: bool | None = None


ProviderEvent = DeltaEvent | UsageEvent | DoneEvent | ErrorEvent


class Cancelled(Exception):
    """Raised internally when a cancel token is triggered (not propagated outward)."""


class CancelToken:
    """A simple cancellation token for cooperative cancellation.

    Providers should periodically call ``await token.raise_if_cancelled()``.
    """

    __slots__ = ("_event",)

    def __init__(self) -> None:
        self._event = asyncio.Event()

    def cancel(self) -> None:
        self._event.set()

    def is_cancelled(self) -> bool:
        return self._event.is_set()

    async def raise_if_cancelled(self) -> None:
        if self.is_cancelled():
            raise Cancelled()


@runtime_checkable
class AIProvider(Protocol):
    def stream(
        self,
        *,
        prompt: str,
        settings: ProviderSettings,
        context: ProviderContext,
        cancel: CancelToken,
    ) -> AsyncIterator[ProviderEvent]:
        """Return an async iterator yielding provider events.

        Implementations may be async generators defined with ``async def``.
        The Protocol uses a normal method signature to match async generator
        semantics for static type checkers (mypy treats async generators as
        regular defs returning AsyncIterator).
        """
        ...


def collect_text(deltas: Iterable[DeltaEvent]) -> str:
    return "".join(d.value for d in deltas)


__all__ = [
    "AIProvider",
    "ProviderSettings",
    "ProviderContext",
    "ProviderEvent",
    "DeltaEvent",
    "UsageEvent",
    "DoneEvent",
    "ErrorEvent",
    "CancelToken",
    "Cancelled",
    "collect_text",
]
