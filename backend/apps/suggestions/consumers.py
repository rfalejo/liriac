"""WebSocket consumer for streaming AI suggestions (BL-008).

Implements a start-on-connect protocol:

Client -> Server:
  {"type": "start", "chapter_id": int, "prompt": str, "settings"?: {...}, "context"?: {...}}
  {"type": "stop"}

Server -> Client:
  {"type": "started", "session_id": str}
  {"type": "delta", "value": str}
  {"type": "usage", "prompt_tokens": int, "completion_tokens": int, "total_tokens": int}
  {"type": "error", "message": str, "code"?: str, "retryable"?: bool}
  {"type": "done"}

Close semantics:
  - Normal completion after done/error: code 1000 (unless internal error -> 1011)
  - Validation / protocol errors: code 4400
  - Not found (future session path usage): code 4404
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from dataclasses import asdict
from typing import Any

from channels.generic.websocket import AsyncWebsocketConsumer

from apps.suggestions.providers.base import ProviderContext, ProviderSettings
from apps.suggestions.services.stream import SuggestionsService

logger = logging.getLogger(__name__)


def _build_settings(data: dict[str, Any] | None) -> ProviderSettings:
    if not data:
        return ProviderSettings()
    kwargs: dict[str, Any] = {}
    for key in ("model", "temperature", "max_tokens", "stop"):
        if key in data:
            kwargs[key] = data[key]
    return ProviderSettings(**kwargs)


def _build_context(data: dict[str, Any] | None) -> ProviderContext:
    if not data:
        return ProviderContext()
    kwargs: dict[str, Any] = {}
    for key in ("system_prompt", "personas", "chapter_titles"):
        if key in data:
            kwargs[key] = data[key]
    return ProviderContext(**kwargs)


class SuggestionsConsumer(AsyncWebsocketConsumer):  # pragma: no cover - exercised via tests
    session_id: uuid.UUID | None
    _started: bool
    _stream_task: asyncio.Task[None] | None
    _cancelled: bool

    def __init__(self, *args: Any, **kwargs: Any) -> None:  # noqa: D401 - standard
        super().__init__(*args, **kwargs)
        self.session_id = None
        self._started = False
        self._stream_task = None
        self._cancelled = False

    async def connect(self) -> None:  # noqa: D401
        # Path variant /ws/suggestions/<uuid:session_id>/ is reserved for future (REST-created session) usage.
        # For now we always accept and expect a start message unless session id path is provided (not yet implemented).
        await self.accept()

    async def disconnect(self, code: int) -> None:  # noqa: D401
        # On disconnect, ensure cancellation to cleanup service session.
        if self.session_id is not None and not self._cancelled:
            SuggestionsService.cancel(self.session_id)
        if self._stream_task and not self._stream_task.done():
            self._stream_task.cancel()

    # ---------------------
    # Incoming messages
    # ---------------------
    async def receive(self, text_data: str | None = None, bytes_data: bytes | None = None) -> None:  # noqa: D401
        if text_data is None:
            return
        try:
            payload = json.loads(text_data)
        except Exception:
            await self._protocol_error("invalid json")
            return

        msg_type = payload.get("type")
        if msg_type == "start":
            await self._handle_start(payload)
        elif msg_type == "stop":
            await self._handle_stop()
        else:
            await self._protocol_error("unknown message type")

    # ---------------------
    # Handlers
    # ---------------------
    async def _handle_start(self, payload: dict[str, Any]) -> None:
        if self._started:
            await self._protocol_error("duplicate start")
            return
        chapter_id = payload.get("chapter_id")
        prompt = payload.get("prompt")
        if not isinstance(chapter_id, int) or not isinstance(prompt, str) or not prompt.strip():
            await self._protocol_error("invalid start payload")
            return
        settings = _build_settings(payload.get("settings"))
        context = _build_context(payload.get("context"))
        try:
            session_id, iterator = await SuggestionsService.start(
                chapter_id=chapter_id,
                prompt=prompt,
                settings=settings,
                context=context,
            )
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("failed to start suggestions session: %s", exc)
            await self._internal_error()
            return
        self.session_id = session_id
        self._started = True
        await self.send_json({"type": "started", "session_id": str(session_id)})

        async def _stream() -> None:
            try:
                async for event in iterator:
                    data = asdict(event)
                    await self.send_json(data)
                    if event.type in {"done", "error"}:
                        # Done/error are terminal
                        await self.close(code=1000)
                        break
            except asyncio.CancelledError:  # pragma: no cover - normal on disconnect
                pass
            except Exception as exc:  # pragma: no cover - defensive
                logger.exception("stream task error: %s", exc)
                # Attempt to inform client (may already be closed)
                try:
                    await self.send_json({"type": "error", "message": "internal error"})
                finally:
                    await self.close(code=1011)

        self._stream_task = asyncio.create_task(_stream())

    async def _handle_stop(self) -> None:
        if not self._started or self.session_id is None:
            await self._protocol_error("stop before start")
            return
        # Trigger cancellation; the service will emit synthetic done.
        SuggestionsService.cancel(self.session_id)
        self._cancelled = True
        # No immediate close; wait for stream iterator to send done.

    # ---------------------
    # Error helpers
    # ---------------------
    async def _protocol_error(self, message: str) -> None:
        await self.send_json({"type": "error", "message": message, "code": "protocol"})
        await self.close(code=4400)

    async def _internal_error(self) -> None:
        await self.send_json({"type": "error", "message": "internal error"})
        await self.close(code=1011)

    # ---------------------
    # Utility overrides
    # ---------------------
    async def send_json(self, content: dict[str, Any]) -> None:  # noqa: D401
        await self.send(text_data=json.dumps(content))

__all__ = ["SuggestionsConsumer"]
