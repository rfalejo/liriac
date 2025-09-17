from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator

import pytest
from channels.db import database_sync_to_async

from apps.library.models import Book, Chapter
from apps.suggestions.models import (
    Suggestion,
    SuggestionEvent,
    SuggestionEventType,
    SuggestionStatus,
)
from apps.suggestions.providers.base import (
    ProviderContext,
    ProviderEvent,
    ProviderSettings,
)
from apps.suggestions.providers.mock import MockProvider
from apps.suggestions.services.stream import SuggestionsService

pytestmark = pytest.mark.django_db


@pytest.fixture()
def book_and_chapter() -> Chapter:
    book = Book.objects.create(title="Test Book", slug="test-book")
    chapter = Chapter.objects.create(
        book=book,
        title="Ch 1",
        order=1,
        body="",
        checksum="0" * 64,
    )
    return chapter


async def collect_events(aiter: AsyncIterator[ProviderEvent]) -> list[ProviderEvent]:
    items: list[ProviderEvent] = []
    async for ev in aiter:
        items.append(ev)
    return items


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestSuggestionsService:
    async def test_happy_path_event_order(self, book_and_chapter: Chapter) -> None:
        provider = MockProvider(chunks=["Hello ", "world"], usage=(3, 2))
        session_id, aiter = await SuggestionsService.start(
            chapter_id=book_and_chapter.id,
            prompt="Say hello",
            settings=ProviderSettings(model="test"),
            context=ProviderContext(system_prompt="You are test"),
            provider=provider,
        )
        events = await collect_events(aiter)
        # Expect delta, delta, usage, done
        assert len(events) == 4
        assert [e.type for e in events] == ["delta", "delta", "usage", "done"]
        sugg = await database_sync_to_async(Suggestion.objects.get)(session_id=session_id)
        assert sugg.status == SuggestionStatus.PENDING
        # Events persisted
        persisted = await database_sync_to_async(lambda: list(SuggestionEvent.objects.filter(suggestion=sugg)))()
        assert [ev.event_type for ev in persisted] == [
            SuggestionEventType.DELTA,
            SuggestionEventType.DELTA,
            SuggestionEventType.USAGE,
            SuggestionEventType.DONE,
        ]
        # Usage summary persisted in suggestion payload
        assert sugg.payload.get("usage", {}).get("total_tokens") == 5

    async def test_error_sets_rejected(self, book_and_chapter: Chapter) -> None:
        provider = MockProvider(chunks=["Oops"], usage=None, error="boom")
        session_id, aiter = await SuggestionsService.start(
            chapter_id=book_and_chapter.id,
            prompt="Say hi",
            provider=provider,
        )
        events = await collect_events(aiter)
        # Expect delta then error
        assert [e.type for e in events] == ["delta", "error"]
        sugg = await database_sync_to_async(Suggestion.objects.get)(session_id=session_id)
        assert sugg.status == SuggestionStatus.REJECTED
        persisted = await database_sync_to_async(lambda: list(SuggestionEvent.objects.filter(suggestion=sugg)))()
        assert [ev.event_type for ev in persisted] == [
            SuggestionEventType.DELTA,
            SuggestionEventType.ERROR,
        ]

    async def test_cancellation_mid_stream(self, book_and_chapter: Chapter) -> None:
        provider = MockProvider(chunks=["A", "B", "C"], delay_s=0.05, usage=(1, 1))
        session_id, aiter = await SuggestionsService.start(
            chapter_id=book_and_chapter.id,
            prompt="Letters",
            provider=provider,
        )
        received: list[ProviderEvent] = []

        async def consumer() -> None:
            async for ev in aiter:
                received.append(ev)

        task = asyncio.create_task(consumer())
        # Allow first chunk to arrive
        await asyncio.sleep(0.06)
        SuggestionsService.cancel(session_id)
        await task
        # Should have at least first delta then done
        types = [e.type for e in received]
        assert types[0] == "delta"
        assert types[-1] == "done"
        sugg = await database_sync_to_async(Suggestion.objects.get)(session_id=session_id)
        # Cancel doesn't change status (still pending)
        assert sugg.status == SuggestionStatus.PENDING
        persisted_types = await database_sync_to_async(lambda: [
            ev.event_type for ev in SuggestionEvent.objects.filter(suggestion=sugg)
        ])()
        # Delta then synthetic done
        assert persisted_types[0] == SuggestionEventType.DELTA
        assert persisted_types[-1] == SuggestionEventType.DONE
