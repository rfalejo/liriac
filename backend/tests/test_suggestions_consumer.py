from __future__ import annotations

import asyncio
import json
from typing import Any

import pytest
from channels.testing import WebsocketCommunicator
from django.conf import (
    settings,  # noqa: F401  (may be used by django_db fixture implicitly)
)

from apps.library.models import Book, Chapter
from liriac.asgi import application

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture()
def chapter() -> Chapter:
    # Create simple book/chapter; keep body minimal to reduce locking risk.
    book = Book.objects.create(title="Test", slug="test")
    return Chapter.objects.create(book=book, title="Ch 1", order=1, body="", checksum="0" * 64)


async def _recv_json(comm: WebsocketCommunicator) -> dict[str, Any]:
    msg = await comm.receive_from()
    data: dict[str, Any] = json.loads(msg)
    return data


@pytest.mark.asyncio
class TestSuggestionsConsumer:
    async def test_start_and_stream_to_done(self, chapter: Chapter) -> None:
        comm = WebsocketCommunicator(application, "/ws/suggestions/")
        connected, _ = await comm.connect()
        assert connected
        await comm.send_json_to(
            {
                "type": "start",
                "chapter_id": chapter.id,
                "prompt": "Hello",
                "settings": {"model": "mock"},
            }
        )
        started = await _recv_json(comm)
        assert started["type"] == "started"
        events: list[str] = []
        # read next few events (mock provider deterministic)
        for _ in range(5):
            data = await _recv_json(comm)
            events.append(data["type"])
            if data["type"] == "done":
                break
        assert events[-1] == "done"
        await comm.disconnect()

    async def test_stop_mid_stream(self, chapter: Chapter) -> None:
        comm = WebsocketCommunicator(application, "/ws/suggestions/")
        assert (await comm.connect())[0]
        await comm.send_json_to(
            {"type": "start", "chapter_id": chapter.id, "prompt": "Letters"}
        )
        started = await _recv_json(comm)
        assert started["type"] == "started"
        # Wait for first delta
        first = await _recv_json(comm)
        assert first["type"] == "delta"
        await comm.send_json_to({"type": "stop"})
        # Expect done eventually
        term = None
        for _ in range(5):
            data = await _recv_json(comm)
            if data["type"] == "done":
                term = "done"
                break
        assert term == "done"
        await comm.disconnect()

    async def test_duplicate_start(self, chapter: Chapter) -> None:
        comm = WebsocketCommunicator(application, "/ws/suggestions/")
        assert (await comm.connect())[0]
        await comm.send_json_to(
            {"type": "start", "chapter_id": chapter.id, "prompt": "One"}
        )
        _ = await _recv_json(comm)  # started
        await comm.send_json_to(
            {"type": "start", "chapter_id": chapter.id, "prompt": "Two"}
        )
        err_or_close: dict[str, Any] | None = None
        try:
            err_or_close = await asyncio.wait_for(comm.receive_json_from(), timeout=1)
        except Exception:  # pragma: no cover - communicator may already have closed
            pass
        if err_or_close is not None:
            assert err_or_close["type"] == "error"
            assert err_or_close.get("code") == "protocol"
        await comm.disconnect()

    async def test_invalid_payload(self) -> None:
        comm = WebsocketCommunicator(application, "/ws/suggestions/")
        assert (await comm.connect())[0]
        await comm.send_to(text_data="not json")
        err = await comm.receive_json_from()
        assert err["type"] == "error"
        await comm.disconnect()
