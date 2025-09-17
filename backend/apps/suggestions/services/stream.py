"""Suggestions streaming orchestrator service (BL-007).

This module coordinates provider streaming, persistence of events, and
exposes a simple `start` API returning a session ID and async iterator of
events. Cancellation is supported via `cancel(session_id)`.
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from collections.abc import AsyncIterator
from dataclasses import asdict

from channels.db import database_sync_to_async

from apps.suggestions.models import (
    Suggestion,
    SuggestionEvent,
    SuggestionEventType,
    SuggestionStatus,
)
from apps.suggestions.providers.base import (
    AIProvider,
    Cancelled,
    CancelToken,
    DoneEvent,
    ErrorEvent,
    ProviderContext,
    ProviderEvent,
    ProviderSettings,
    UsageEvent,
)
from apps.suggestions.providers.mock import MockProvider
from apps.suggestions.providers.openai import OpenAIProvider

logger = logging.getLogger(__name__)

_SENTINEL = object()


def get_provider(kind: str | None = None) -> AIProvider:
    kind = (kind or "mock").lower()
    if kind == "openai":
        return OpenAIProvider()
    return MockProvider()


class SuggestionsService:
    _sessions: dict[uuid.UUID, CancelToken] = {}

    @classmethod
    async def start(
        cls,
        *,
        chapter_id: int,
        prompt: str,
        settings: ProviderSettings | None = None,
        context: ProviderContext | None = None,
        provider: AIProvider | None = None,
    ) -> tuple[uuid.UUID, AsyncIterator[ProviderEvent]]:
        """Start a new suggestion streaming session.

        Returns a tuple of (session_id, async iterator of ProviderEvent).
        """
        if settings is None:
            settings = ProviderSettings()
        if context is None:
            context = ProviderContext()
        if provider is None:
            provider = get_provider()

    # (Optional) Chapter existence is implicitly validated by FK constraint on create.

        session_id = uuid.uuid4()
        token = CancelToken()
        cls._sessions[session_id] = token

        suggestion = await database_sync_to_async(Suggestion.objects.create)(
            chapter_id=chapter_id, session_id=session_id, status=SuggestionStatus.PENDING
        )

        queue: asyncio.Queue[ProviderEvent | object] = asyncio.Queue()
        done_flag = False

        async def runner() -> None:
            nonlocal done_flag
            try:
                stream_iter = provider.stream(prompt=prompt, settings=settings, context=context, cancel=token)
                async for event in stream_iter:
                    # Persist event
                    etype: SuggestionEventType
                    if isinstance(event, DoneEvent):
                        etype = SuggestionEventType.DONE
                        done_flag = True
                    elif isinstance(event, ErrorEvent):
                        etype = SuggestionEventType.ERROR
                        done_flag = True
                        suggestion.status = SuggestionStatus.REJECTED
                        await database_sync_to_async(suggestion.save)(update_fields=["status", "updated_at"])
                    elif isinstance(event, UsageEvent):
                        etype = SuggestionEventType.USAGE
                        # keep usage summary in payload on suggestion model
                        suggestion.payload = {
                            **suggestion.payload,
                            "usage": {
                                "prompt_tokens": event.prompt_tokens,
                                "completion_tokens": event.completion_tokens,
                                "total_tokens": event.total_tokens,
                            },
                        }
                        await database_sync_to_async(suggestion.save)(update_fields=["payload", "updated_at"])
                    else:
                        etype = SuggestionEventType.DELTA
                    await database_sync_to_async(SuggestionEvent.objects.create)(
                        suggestion=suggestion,
                        event_type=etype,
                        payload=asdict(event),
                    )
                    await queue.put(event)
            except Cancelled:
                if not done_flag:
                    # Persist synthetic done event on cancellation for consistency
                    await database_sync_to_async(SuggestionEvent.objects.create)(
                        suggestion=suggestion, event_type=SuggestionEventType.DONE, payload={}
                    )
                    await queue.put(DoneEvent())
            except Exception as exc:  # pragma: no cover - defensive; should be handled by provider
                logger.exception("Unexpected error in suggestions runner: %s", exc)
                await database_sync_to_async(SuggestionEvent.objects.create)(
                    suggestion=suggestion,
                    event_type=SuggestionEventType.ERROR,
                    payload={"message": str(exc)},
                )
                suggestion.status = SuggestionStatus.REJECTED
                await database_sync_to_async(suggestion.save)(update_fields=["status", "updated_at"])
                await queue.put(ErrorEvent(message="internal error"))
            finally:
                await queue.put(_SENTINEL)
                # cleanup session
                cls._sessions.pop(session_id, None)

        # Fire background task
        asyncio.create_task(runner())

        async def iterator() -> AsyncIterator[ProviderEvent]:
            while True:
                item = await queue.get()
                if item is _SENTINEL:
                    break
                # mypy: narrow type
                assert not isinstance(item, object) or item is not _SENTINEL
                yield item  # type: ignore[misc]

        return session_id, iterator()

    @classmethod
    def cancel(cls, session_id: uuid.UUID) -> bool:
        token = cls._sessions.get(session_id)
        if token is None:
            return False
        token.cancel()
        return True


__all__ = ["SuggestionsService", "get_provider"]
