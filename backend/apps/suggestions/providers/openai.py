"""OpenAI-compatible streaming provider.

Parses Server-Sent Events style `data: {...}` lines and yields normalized
ProviderEvents. Implements simple bounded exponential backoff retries on
transient HTTP errors (429/5xx) and read timeouts.
"""
from __future__ import annotations

import asyncio
import json
import os
import random
import re
from collections.abc import AsyncIterator
from typing import Any

import httpx

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

SSE_LINE_RE = re.compile(r"^data: (.*)$")


def _backoff(attempt: int) -> float:
    base: float = 0.5 * (2**attempt)
    jitter: float = random.uniform(-0.25, 0.25)
    delay: float = max(0.1, base + jitter)
    return delay


class OpenAIProvider(AIProvider):
    def __init__(self, *, base_url: str | None = None, api_key: str | None = None) -> None:
        self._base_url = base_url or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self._api_key = api_key or os.getenv("OPENAI_API_KEY", "test-key")

    def stream(
        self,
        *,
        prompt: str,
        settings: ProviderSettings,
        context: ProviderContext,
        cancel: CancelToken,
    ) -> AsyncIterator[ProviderEvent]:
        async def _gen() -> AsyncIterator[ProviderEvent]:
            url = f"{self._base_url}/chat/completions"
            headers = {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}
            payload: dict[str, Any] = {
                "model": settings.model,
                "stream": True,
                "temperature": settings.temperature,
                "messages": [
                    {"role": "system", "content": context.system_prompt or "You are a writing assistant."},
                    {"role": "user", "content": prompt},
                ],
            }
            if settings.max_tokens is not None:
                payload["max_tokens"] = settings.max_tokens
            if settings.stop:
                payload["stop"] = settings.stop

            timeouts = httpx.Timeout(connect=10.0, read=45.0, write=45.0, pool=None)
            max_attempts = 3
            attempt = 0
            client = httpx.AsyncClient(timeout=timeouts, headers=headers)
            try:
                while True:
                    await cancel.raise_if_cancelled()
                    try:
                        resp = await client.post(url, json=payload)
                    except (httpx.TransportError, httpx.ReadTimeout):
                        if attempt + 1 >= max_attempts:
                            yield ErrorEvent(message="network error", code="network", retryable=False)
                            return
                        await cancel.raise_if_cancelled()
                        await asyncio.sleep(_backoff(attempt))
                        attempt += 1
                        continue

                    if resp.status_code >= 400:
                        retryable = resp.status_code in {429, 500, 502, 503, 504}
                        if retryable and attempt + 1 < max_attempts:
                            await asyncio.sleep(_backoff(attempt))
                            attempt += 1
                            continue
                        try:
                            err_json = resp.json()
                            msg = err_json.get("error", {}).get("message", str(err_json))
                        except Exception:  # pragma: no cover - defensive
                            msg = resp.text
                        yield ErrorEvent(message=msg, code=str(resp.status_code), retryable=retryable)
                        return

                    # Stream the body line by line (SSE style)
                    async for raw_line in resp.aiter_lines():
                        await cancel.raise_if_cancelled()
                        if not raw_line:
                            continue
                        m = SSE_LINE_RE.match(raw_line)
                        if not m:
                            continue
                        data = m.group(1)
                        if data == "[DONE]":
                            yield DoneEvent()
                            return
                        try:
                            chunk = json.loads(data)
                        except json.JSONDecodeError:
                            continue  # skip malformed lines silently
                        # Extract delta content
                        for choice in chunk.get("choices", []):
                            delta = choice.get("delta", {})
                            content_part = delta.get("content")
                            if content_part:
                                yield DeltaEvent(value=content_part)
                        # Usage may appear at end or separate; handle if present
                        usage = chunk.get("usage")
                        if usage:
                            yield UsageEvent(
                                prompt_tokens=usage.get("prompt_tokens", 0),
                                completion_tokens=usage.get("completion_tokens", 0),
                                total_tokens=usage.get("total_tokens", 0),
                            )
                    # If loop ends without [DONE] sentinel treat as done.
                    yield DoneEvent()
                    return
            finally:  # pragma: no cover - simple cleanup
                await client.aclose()

        return _gen()


__all__ = ["OpenAIProvider"]
