from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Optional

import anyio
import httpx

from ....domain.ports import AIProvider
from ....domain.types import AISettings, ContextProfile, StreamEvent, Tokens
from ...config.settings import AppSettings


@dataclass
class _RetryState:
    attempted: bool = False


class OpenAIProvider(AIProvider):
    """OpenAI-compatible streaming provider using httpx.AsyncClient."""

    def __init__(self, app_settings: AppSettings) -> None:
        self._settings = app_settings

    def stream(
        self,
        *,
        prompt: str,
        settings: AISettings,
        context: Optional[ContextProfile] = None,
    ) -> AsyncIterator[StreamEvent]:
        return self._stream_impl(prompt=prompt, settings=settings, context=context)

    async def _stream_impl(
        self,
        *,
        prompt: str,
        settings: AISettings,
        context: Optional[ContextProfile],
    ) -> AsyncIterator[StreamEvent]:
        # Resolve effective parameters
        model = settings.model or self._settings.openai_model
        max_tokens = (
            settings.max_tokens
            if settings.max_tokens is not None
            else self._settings.openai_max_tokens
        )
        temperature = 0.0 if settings.temperature is None else settings.temperature

        base_url = self._settings.openai_base_url or "https://api.openai.com/v1"
        url = f"{base_url.rstrip('/')}/chat/completions"
        api_key = self._settings.openai_api_key
        if not api_key:
            raise ValueError("OPENAI_API_KEY missing in settings")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        body: dict[str, object] = {
            "model": model,
            "messages": self._build_messages(prompt=prompt, context=context),
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        timeout_s = float(self._settings.openai_request_timeout)

        retry = _RetryState()
        while True:
            try:
                async with httpx.AsyncClient(timeout=timeout_s) as client:
                    # Enforce overall timeout & allow external cancellation
                    with anyio.fail_after(timeout_s):
                        async with client.stream("POST", url, headers=headers, json=body) as resp:
                            if resp.status_code >= 500:
                                if not retry.attempted:
                                    retry.attempted = True
                                    await anyio.sleep(0.35)
                                    continue
                                raise ValueError(f"Upstream error {resp.status_code}")

                            if resp.status_code >= 400:
                                # Read error text safely
                                text = await resp.aread()
                                raise ValueError(
                                    f"HTTP {resp.status_code}: {text.decode(errors='ignore')[:200]}"
                                )

                            usage: Tokens | None = None
                            async for line in resp.aiter_lines():
                                if not line:
                                    continue
                                if line.startswith("data: "):
                                    data = line[len("data: ") :].strip()
                                else:
                                    continue

                                if data == "[DONE]":
                                    # End of stream
                                    yield StreamEvent(done=True, usage=usage)
                                    return

                                # Parse JSON chunk
                                try:
                                    import json

                                    payload = json.loads(data)
                                except Exception:
                                    # Skip malformed chunk
                                    continue

                                # Extract delta text if present
                                try:
                                    choices = payload.get("choices")
                                    if isinstance(choices, list) and choices:
                                        first = choices[0]
                                        if isinstance(first, dict):
                                            delta = first.get("delta")
                                            if isinstance(delta, dict):
                                                content = delta.get("content")
                                                if isinstance(content, str) and content:
                                                    yield StreamEvent(delta=content)
                                except Exception:
                                    # Be robust to unexpected shapes
                                    pass

                                # Capture usage if present (usually in final payloads)
                                u_obj = payload.get("usage") if isinstance(payload, dict) else None
                                if isinstance(u_obj, dict):
                                    usage = Tokens(
                                        prompt=self._maybe_int(u_obj.get("prompt_tokens")),
                                        completion=self._maybe_int(u_obj.get("completion_tokens")),
                                        total=self._maybe_int(u_obj.get("total_tokens")),
                                    )

                        # If we exit the context without returning, it was a timeout/cancel
                        yield StreamEvent(done=True, error="timeout")
                        return
            except TimeoutError:
                # anyio.fail_after timeout
                yield StreamEvent(done=True, error="timeout")
                return
            except (httpx.TransportError, httpx.TimeoutException):
                if not retry.attempted:
                    retry.attempted = True
                    await anyio.sleep(0.35)
                    continue
                yield StreamEvent(done=True, error="network error")
                return

    def _build_messages(
        self, *, prompt: str, context: Optional[ContextProfile]
    ) -> list[dict[str, str]]:
        system = (context.system_prompt if context else "").strip()
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return messages

    @staticmethod
    def _maybe_int(value: object) -> int | None:
        return value if isinstance(value, int) else None
