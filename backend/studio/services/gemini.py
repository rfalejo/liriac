from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from django.conf import settings
from google import genai
from google.genai import types


class GeminiServiceError(RuntimeError):
    """Raised when the Gemini API returns an unexpected response."""


_client: Optional[genai.Client] = None


def _log_interaction(*, prompt: str, response_text: str) -> None:
    """Persist the Gemini prompt and raw response as a markdown file."""

    base_dir = Path(settings.BASE_DIR)
    logs_dir = base_dir / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S%fZ")
    log_path = logs_dir / f"{timestamp}.md"

    log_content = (
        f"# Gemini Interaction {timestamp}\n\n"
        "## Prompt\n\n"
        f"```\n{prompt}\n```\n\n"
        "## Response\n\n"
        f"```\n{response_text}\n```\n"
    )

    log_path.write_text(log_content, encoding="utf-8")


def _get_client() -> genai.Client:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise GeminiServiceError(
            "Gemini API key is not configured. Set GEMINI_API_KEY in the environment."
        )

    global _client
    if _client is None:
        _client = genai.Client(api_key=api_key)
    return _client


def generate_paragraph_suggestion(
    *, prompt: str, model: str = "gemini-2.5-flash-preview-09-2025"
) -> str:
    """Return a paragraph suggestion using the Gemini text generation model."""

    client = _get_client()

    config = types.GenerateContentConfig(
        temperature=1.0,
        response_mime_type="application/json",
        response_schema=types.Schema(
            type="OBJECT",
            required=["paragraph_suggestion"],
            properties={
                "paragraph_suggestion": types.Schema(
                    type="STRING",
                    description="Parrafo sugerido en espanol.",
                )
            },
        ),
    )

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=config,
    )

    text = response.text or ""

    _log_interaction(prompt=prompt, response_text=text)

    if not text:
        raise GeminiServiceError("Gemini API returned an empty response.")

    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiServiceError("Gemini API returned malformed JSON.") from exc

    suggestion = payload.get("paragraph_suggestion")
    if not isinstance(suggestion, str) or not suggestion.strip():
        raise GeminiServiceError(
            "Gemini API response is missing a valid paragraph_suggestion field."
        )

    return suggestion.strip()


def generate_block_conversion(
    *, prompt: str, model: str = "gemini-2.5-flash-preview-09-2025"
) -> Dict[str, Any]:
    """Convert raw prose into structured chapter blocks using Gemini."""

    client = _get_client()

    block_schema = types.Schema(
        type="OBJECT",
        required=["type"],
        properties={
            "type": types.Schema(
                type="STRING",
                description="Tipo de bloque: 'paragraph' o 'dialogue'.",
            ),
            "text": types.Schema(
                type="STRING",
                description="Contenido del párrafo en texto plano.",
            ),
            "context": types.Schema(
                type="STRING",
                description="Descripción opcional del diálogo.",
            ),
            "turns": types.Schema(
                type="ARRAY",
                items=types.Schema(
                    type="OBJECT",
                    required=["utterance"],
                    properties={
                        "id": types.Schema(type="STRING"),
                        "speakerId": types.Schema(type="STRING"),
                        "speakerName": types.Schema(type="STRING"),
                        "utterance": types.Schema(type="STRING"),
                        "stageDirection": types.Schema(type="STRING"),
                    },
                ),
            ),
        },
    )

    config = types.GenerateContentConfig(
        temperature=0.7,
        response_mime_type="application/json",
        response_schema=types.Schema(
            type="OBJECT",
            required=["blocks"],
            properties={
                "blocks": types.Schema(
                    type="ARRAY",
                    items=block_schema,
                    description="Secuencia ordenada de bloques.",
                ),
                "model": types.Schema(
                    type="STRING",
                    description="Modelo que generó la respuesta.",
                ),
            },
        ),
    )

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=config,
    )

    text = response.text or ""

    _log_interaction(prompt=prompt, response_text=text)

    if not text:
        raise GeminiServiceError("Gemini API returned an empty response.")

    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiServiceError("Gemini API returned malformed JSON.") from exc

    blocks = payload.get("blocks")
    if not isinstance(blocks, list) or not blocks:
        raise GeminiServiceError("Gemini API response must include at least un bloque en 'blocks'.")

    return {"blocks": blocks, "model": payload.get("model") or model}
