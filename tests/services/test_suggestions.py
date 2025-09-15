from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import AsyncIterator, Optional

import pytest

from liriac.domain.ports import AIProvider
from liriac.domain.types import AISettings, ContextProfile, StreamEvent
from liriac.domain.value_objects import ChapterRef
from liriac.domain.types import BookId
from liriac.services import (
    SuggestionsHistory,
    SuggestionsService,
    merge_text,
)


class FakeAIProvider(AIProvider):
    def stream(
        self,
        *,
        prompt: str,
        settings: AISettings,
        context: Optional[ContextProfile] = None,
    ) -> AsyncIterator[StreamEvent]:
        async def gen() -> AsyncIterator[StreamEvent]:
            yield StreamEvent(delta="Hello ")
            yield StreamEvent(delta="world!")
            yield StreamEvent(done=True)
        return gen()


@pytest.fixture()
def chapter_ref() -> ChapterRef:
    return ChapterRef(book_id=BookId("test-book"), relative_path=PurePosixPath("chapters/01-start.md"))


@pytest.mark.asyncio
async def test_streaming_and_history(tmp_path: Path, chapter_ref: ChapterRef) -> None:
    provider = FakeAIProvider()
    service = SuggestionsService(provider, base_dir=tmp_path)

    deltas: list[str] = []
    async for event in service.generate(
        prompt="say hello",
        settings=AISettings(model="gpt-test"),
        context=None,
        ref=chapter_ref,
    ):
        if event.delta:
            deltas.append(event.delta)

    assert "".join(deltas) == "Hello world!"

    hist = service.get_history(chapter_ref)
    assert len(hist) == 1
    assert hist[0].text == "Hello world!"


@pytest.mark.asyncio
async def test_regenerate_increases_history(tmp_path: Path, chapter_ref: ChapterRef) -> None:
    provider = FakeAIProvider()
    service = SuggestionsService(provider, base_dir=tmp_path)

    # First generation
    async for _ in service.generate(
        prompt="say hello",
        settings=AISettings(model="gpt-test"),
        context=None,
        ref=chapter_ref,
    ):
        pass

    service.regenerate(chapter_ref)

    # Second generation
    async for _ in service.generate(
        prompt="say hello again",
        settings=AISettings(model="gpt-test"),
        context=None,
        ref=chapter_ref,
    ):
        pass

    hist = service.get_history(chapter_ref)
    assert len(hist) == 2


def test_merge_text_exact_spacing() -> None:
    base = "Line one\nLine two\n"
    sugg = "More text\nwith lines\n"
    merged = merge_text(base, sugg)
    assert merged.endswith("\n")
    # Exactly one blank line between base and suggestion
    assert merged == "Line one\nLine two\n\nMore text\nwith lines\n"


def test_accept_and_logging(tmp_path: Path, chapter_ref: ChapterRef) -> None:
    # Build history with one suggestion
    from liriac.services.suggestions.history import SuggestionsHistory
    from liriac.domain.entities.suggestion import Suggestion
    from liriac.domain.types import SuggestionId

    hist = SuggestionsHistory()
    suggestion = Suggestion(
        id=SuggestionId("s1"),
        text="Accepted text",
        source="ai",
        created_at=datetime.now(timezone.utc),
        status="pending",
    )
    hist.add(chapter_ref, suggestion)

    service = SuggestionsService(provider=FakeAIProvider(), base_dir=tmp_path, history=hist)

    base_text = "Before\n"
    merged = service.accept(ref=chapter_ref, base_text=base_text, index=0)

    assert merged == "Before\n\nAccepted text\n"

    # Expect a log file
    suggestions_dir = tmp_path / str(chapter_ref.book_id) / ".liriac" / "suggestions"
    files = list(suggestions_dir.glob("*.md"))
    assert files, "log file should be created"
    name = files[0].name
    assert name.endswith(f"-{chapter_ref.relative_path.stem}.md")

    content = files[0].read_text(encoding="utf-8")
    assert content.endswith("\n")
    assert "Accepted text" in content

    # Ensure no tmp remains
    assert not list(suggestions_dir.glob("*.tmp"))


def test_history_window() -> None:
    from liriac.domain.entities.suggestion import Suggestion
    from liriac.domain.types import SuggestionId

    hist = SuggestionsHistory(max_per_chapter=2)

    ref = ChapterRef(book_id=BookId("b1"), relative_path=PurePosixPath("chapters/01.md"))
    s1 = Suggestion(
        id=SuggestionId("1"),
        text="a",
        source="ai",
        created_at=datetime.now(timezone.utc),
        status="pending",
    )
    s2 = Suggestion(
        id=SuggestionId("2"),
        text="b",
        source="ai",
        created_at=datetime.now(timezone.utc),
        status="pending",
    )
    s3 = Suggestion(
        id=SuggestionId("3"),
        text="c",
        source="ai",
        created_at=datetime.now(timezone.utc),
        status="pending",
    )

    hist.add(ref, s1)
    hist.add(ref, s2)
    hist.add(ref, s3)

    got = hist.get(ref)
    assert tuple(x.id for x in got) == (s2.id, s3.id)
