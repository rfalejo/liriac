from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import anyio
import httpx
import pytest
import respx

from liriac.domain.types import AISettings, StreamEvent
from liriac.infra.ai.openai.client import OpenAIProvider
from liriac.infra.config.settings import AppSettings


@pytest.mark.asyncio
async def test_import_provider() -> None:
    from liriac.infra.ai.openai.client import OpenAIProvider as _O

    assert _O is not None


def _sse(data: dict[str, Any] | str) -> bytes:
    if isinstance(data, str):
        payload = data
    else:
        payload = json.dumps(data)
    return f"data: {payload}\n\n".encode()


@pytest.mark.asyncio
async def test_streaming_happy_path() -> None:
    settings = AppSettings(openai_api_key="sk-test")
    provider = OpenAIProvider(settings)

    base_url = settings.openai_base_url or "https://api.openai.com/v1"

    deltas: list[str] = []
    async with respx.mock(assert_all_called=True) as router:
        route = router.post(f"{base_url}/chat/completions").mock(
            return_value=httpx.Response(
                200,
                content=b"".join(
                    [
                        _sse({"choices": [{"delta": {"content": "Hello"}}]}),
                        _sse({"choices": [{"delta": {"content": " world"}}]}),
                        _sse("[DONE]"),
                    ]
                ),
                headers={"Content-Type": "text/event-stream"},
            )
        )

        async for event in provider.stream(prompt="hi", settings=AISettings()):
            assert isinstance(event, StreamEvent)
            if event.delta:
                deltas.append(event.delta)
            if event.done:
                break

    assert route.called
    assert "".join(deltas) == "Hello world"


@pytest.mark.asyncio
async def test_usage_mapping() -> None:
    settings = AppSettings(openai_api_key="sk-test")
    provider = OpenAIProvider(settings)
    base_url = settings.openai_base_url or "https://api.openai.com/v1"

    chunks = [
        _sse({"choices": [{"delta": {"content": "X"}}]}),
        _sse(
            {
                "choices": [{"delta": {}}],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15,
                },
            }
        ),
        _sse("[DONE]"),
    ]

    async with respx.mock(assert_all_called=True) as router:
        respx_route = router.post(f"{base_url}/chat/completions").mock(
            return_value=httpx.Response(
                200,
                content=b"".join(chunks),
                headers={"Content-Type": "text/event-stream"},
            )
        )

        last_event: StreamEvent | None = None
        async for event in provider.stream(prompt="p", settings=AISettings()):
            last_event = event
            if event.done:
                break

    assert respx_route.called
    assert last_event is not None
    assert last_event.done is True
    assert last_event.usage is not None
    assert last_event.usage.prompt == 10
    assert last_event.usage.completion == 5
    assert last_event.usage.total == 15


@pytest.mark.asyncio
async def test_retry_on_transient_failure() -> None:
    settings = AppSettings(openai_api_key="sk-test")
    provider = OpenAIProvider(settings)
    base_url = settings.openai_base_url or "https://api.openai.com/v1"

    calls: list[str] = []

    def responder(request: httpx.Request) -> httpx.Response:  # noqa: ARG001
        # First call fails, second succeeds
        calls.append("x")
        if len(calls) == 1:
            return httpx.Response(502, text="Bad Gateway")
        return httpx.Response(
            200,
            content=b"".join(
                [
                    _sse({"choices": [{"delta": {"content": "ok"}}]}),
                    _sse("[DONE]"),
                ]
            ),
            headers={"Content-Type": "text/event-stream"},
        )

    async with respx.mock(assert_all_called=True) as router:
        respx_route = router.post(f"{base_url}/chat/completions").mock(side_effect=responder)

        events: list[StreamEvent] = []
        async for event in provider.stream(prompt="p", settings=AISettings()):
            events.append(event)
            if event.done:
                break

    assert respx_route.called
    assert len(calls) == 2
    assert any(e.delta == "ok" for e in events)


@pytest.mark.asyncio
async def test_timeout_cancellation() -> None:
    # Set short timeout to force cancel
    settings = AppSettings(openai_api_key="sk-test", openai_request_timeout=1)
    provider = OpenAIProvider(settings)
    base_url = settings.openai_base_url or "https://api.openai.com/v1"

    async def infinite_stream(_: httpx.Request) -> httpx.Response:
        async def iter_bytes() -> AsyncIterator[bytes]:
            while True:
                yield b"data: {\"choices\":[{\"delta\":{}}]}\n\n"
                await anyio.sleep(0.2)

        return httpx.Response(200, content=iter_bytes(), headers={"Content-Type": "text/event-stream"})

    async with respx.mock(assert_all_called=True) as router:
        respx_route = router.post(f"{base_url}/chat/completions").mock(side_effect=infinite_stream)

        last: StreamEvent | None = None
        async for event in provider.stream(prompt="p", settings=AISettings()):
            last = event
            if event.done:
                break

    assert respx_route.called
    assert last is not None
    assert last.done is True


@pytest.mark.asyncio
async def test_error_mapping_unauthorized() -> None:
    settings = AppSettings(openai_api_key="sk-test")
    provider = OpenAIProvider(settings)
    base_url = settings.openai_base_url or "https://api.openai.com/v1"

    async with respx.mock(assert_all_called=True) as router:
        respx_route = router.post(f"{base_url}/chat/completions").mock(
            return_value=httpx.Response(401, text="Unauthorized")
        )

        with pytest.raises(ValueError) as exc:
            async for _ in provider.stream(prompt="p", settings=AISettings()):
                pass

    assert respx_route.called
    assert "401" in str(exc.value)
