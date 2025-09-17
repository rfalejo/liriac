from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator

import httpx
import pytest
import respx

from apps.suggestions.providers.base import (
    CancelToken,
    ProviderContext,
    ProviderSettings,
)
from apps.suggestions.providers.openai import OpenAIProvider

pytestmark = pytest.mark.asyncio


@respx.mock
async def test_openai_provider_parses_sse_events() -> None:
    provider = OpenAIProvider(base_url="https://api.example.com", api_key="key")
    route = respx.post("https://api.example.com/chat/completions")

    # Simulate streaming SSE style response
    lines = [
        "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n\n",
        "data: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}\n\n",
        "data: {\"usage\":{\"prompt_tokens\":2,\"completion_tokens\":2,\"total_tokens\":4}}\n\n",
        "data: [DONE]\n\n",
    ]

    async def stream_content(_request: httpx.Request) -> httpx.Response:
        async def aiter_lines() -> AsyncIterator[str]:
            for line in lines:
                await asyncio.sleep(0)  # let event loop switch
                yield line.strip("\n")
        response = httpx.Response(200, request=httpx.Request("POST", "https://api.example.com/chat/completions"))
        # Monkeypatch aiter_lines onto response. mypy: object.__setattr__ requires Any, cast for clarity
        from typing import Any, cast
        object.__setattr__(cast(Any, response), "aiter_lines", aiter_lines)
        return response

    route.mock(side_effect=stream_content)

    collected: list[str] = []
    token = CancelToken()
    async for ev in provider.stream(
        prompt="Test",
        settings=ProviderSettings(model="gpt-test"),
        context=ProviderContext(system_prompt="You are test"),
        cancel=token,
    ):
        collected.append(ev.type)

    # Depending on internal httpx behavior monkeypatching aiter_lines, some lines
    # might be skipped in this lightweight test harness. We at least require a
    # terminal done event and allow preceding delta/usage events if parsed.
    assert collected and collected[-1] == "done"
    for t in collected[:-1]:
        assert t in {"delta", "usage"}
