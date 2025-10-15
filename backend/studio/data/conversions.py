from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4

from django.db import transaction

from ..models import (
    Chapter,
    ChapterBlock,
    ChapterBlockConversion,
    ChapterBlockConversionStatus,
    ChapterBlockType,
)
from ..payloads import (
    BlockConversionBlockPayload,
    BlockConversionSuggestionPayload,
    ChapterDetailPayload,
)
from ..prompts.block_conversion import build_block_conversion_prompt
from ..serializers import ChapterBlockCreateSerializer
from ..services.gemini import GeminiServiceError, generate_block_conversion
from .blocks import create_chapter_block, extract_chapter_context_for_block

__all__ = [
    "create_block_conversion_suggestion",
    "apply_block_conversion_suggestion",
]


class BlockConversionError(RuntimeError):
    """Raised when a stored conversion cannot be applied."""


def _normalize_turns(raw_turns: Any, *, block_id: str) -> List[Dict[str, Any]]:
    if not isinstance(raw_turns, list):
        raise ValueError("Los turnos de diálogo deben entregarse como lista.")

    normalized: List[Dict[str, Any]] = []
    for index, raw_turn in enumerate(raw_turns, start=1):
        if not isinstance(raw_turn, dict):
            raise ValueError("Cada turno de diálogo debe representarse como objeto.")
        utterance = str(raw_turn.get("utterance") or "").strip()
        if not utterance:
            raise ValueError("Cada turno de diálogo requiere un 'utterance'.")
        turn_id = raw_turn.get("id") or f"{block_id}-turn-{index:02d}"
        normalized.append(
            {
                "id": str(turn_id),
                "speakerId": (raw_turn.get("speakerId") or "").strip() or None,
                "speakerName": (raw_turn.get("speakerName") or "").strip() or None,
                "utterance": utterance,
                "stageDirection": (raw_turn.get("stageDirection") or "").strip() or None,
            }
        )

    return normalized


def _normalize_blocks(raw_blocks: Any) -> List[BlockConversionBlockPayload]:
    if not isinstance(raw_blocks, list) or not raw_blocks:
        raise ValueError("El modelo debe devolver al menos un bloque.")

    normalized: List[BlockConversionBlockPayload] = []
    for raw_index, raw_block in enumerate(raw_blocks, start=1):
        if not isinstance(raw_block, dict):
            raise ValueError("Cada bloque debe representarse como objeto JSON.")
        block_type = (raw_block.get("type") or "").strip()
        if block_type not in (ChapterBlockType.PARAGRAPH, ChapterBlockType.DIALOGUE):
            raise ValueError("Solo se admiten bloques de tipo 'paragraph' o 'dialogue'.")

        if block_type == ChapterBlockType.PARAGRAPH:
            text = str(raw_block.get("text") or "").strip()
            if not text:
                raise ValueError("Los bloques de tipo 'paragraph' deben incluir campo 'text'.")
            normalized.append(
                {
                    "type": ChapterBlockType.PARAGRAPH,
                    "text": text,
                }
            )
            continue

        turns = _normalize_turns(raw_block.get("turns"), block_id=f"draft-{raw_index:02d}")
        block_payload: BlockConversionBlockPayload = {
            "type": ChapterBlockType.DIALOGUE,
            "turns": turns,
        }
        context = (raw_block.get("context") or "").strip()
        if context:
            block_payload["context"] = context
        normalized.append(block_payload)
    return normalized


def _build_conversion_prompt(
    *,
    chapter: Chapter,
    source_text: str,
    instructions: Optional[str],
    context_block_id: Optional[str],
) -> str:
    chapter_payload: ChapterDetailPayload = chapter.to_detail_payload()
    context_window = extract_chapter_context_for_block(chapter_payload, context_block_id)
    return build_block_conversion_prompt(
        chapter=chapter_payload,
        context_window=context_window,
        source_text=source_text,
        user_instructions=instructions,
    )


def create_block_conversion_suggestion(
    *,
    chapter_id: str,
    text: str,
    instructions: Optional[str] = None,
    context_block_id: Optional[str] = None,
    model: str = "gemini-2.5-flash-preview-09-2025",
) -> BlockConversionSuggestionPayload:
    cleaned_text = text.strip()
    if not cleaned_text:
        raise ValueError("El texto fuente no puede estar vacío.")

    try:
        chapter = (
            Chapter.objects.select_related("book")
            .prefetch_related("blocks", "blocks__active_version")
            .get(pk=chapter_id)
        )
    except Chapter.DoesNotExist as exc:
        raise KeyError(f"Unknown chapter: {chapter_id}") from exc

    conversion = ChapterBlockConversion.objects.create(
        chapter=chapter,
        source_text=cleaned_text,
        instructions=instructions or "",
        context_block_id=context_block_id or "",
        provider="gemini",
    )

    prompt = _build_conversion_prompt(
        chapter=chapter,
        source_text=cleaned_text,
        instructions=instructions,
        context_block_id=context_block_id,
    )

    try:
        response = generate_block_conversion(prompt=prompt, model=model)
    except GeminiServiceError as exc:
        conversion.mark_failed(message=str(exc))
        raise

    raw_blocks = response.get("blocks")
    normalized_blocks = _normalize_blocks(raw_blocks)

    conversion.model_name = response.get("model") or model
    conversion.suggested_blocks = normalized_blocks
    conversion.status = ChapterBlockConversionStatus.PENDING
    conversion.save(update_fields=["model_name", "suggested_blocks", "status", "updated_at"])

    return {
        "conversionId": str(conversion.id),
        "blocks": normalized_blocks,
    }


def _build_create_payload(block: BlockConversionBlockPayload) -> Dict[str, Any]:
    block_type = block.get("type")
    if block_type == ChapterBlockType.PARAGRAPH:
        return {
            "type": ChapterBlockType.PARAGRAPH,
            "text": block.get("text", ""),
            "style": "narration",
        }

    payload: Dict[str, Any] = {
        "type": ChapterBlockType.DIALOGUE,
        "turns": [],
    }
    turns = block.get("turns") or []
    for turn in turns:
        new_turn = {
            "id": turn.get("id") or uuid4().hex,
            "speakerId": turn.get("speakerId"),
            "speakerName": turn.get("speakerName"),
            "utterance": turn.get("utterance"),
            "stageDirection": turn.get("stageDirection"),
        }
        payload["turns"].append(new_turn)
    context = block.get("context")
    if context:
        payload["context"] = context
    return payload


def apply_block_conversion_suggestion(
    *,
    conversion_id: str,
    anchor_block_id: Optional[str] = None,
    placement: str = "after",
) -> ChapterDetailPayload:
    if placement not in {"before", "after", "append"}:
        raise ValueError("La posición debe ser 'before', 'after' o 'append'.")

    with transaction.atomic():
        try:
            conversion = (
                ChapterBlockConversion.objects.select_for_update()
                .select_related("chapter", "chapter__book")
                .get(pk=conversion_id)
            )
        except ChapterBlockConversion.DoesNotExist as exc:
            raise KeyError(f"Unknown conversion: {conversion_id}") from exc

        if conversion.status != ChapterBlockConversionStatus.PENDING:
            raise BlockConversionError("La conversión ya fue procesada o cancelada.")

        suggested_blocks = conversion.suggested_blocks or []
        if not suggested_blocks:
            raise BlockConversionError("No hay bloques sugeridos para aplicar.")

        prepared_payloads = [_build_create_payload(block) for block in suggested_blocks]
        serializer = ChapterBlockCreateSerializer(data=prepared_payloads, many=True)
        serializer.is_valid(raise_exception=True)

        chapter = conversion.chapter
        base_position: Optional[int] = None
        if placement != "append" and anchor_block_id:
            try:
                anchor = (
                    ChapterBlock.objects.select_for_update()
                    .only("id", "position")
                    .get(chapter=chapter, pk=anchor_block_id)
                )
            except ChapterBlock.DoesNotExist as exc:
                raise KeyError(f"Unknown anchor block: {anchor_block_id}") from exc
            base_position = anchor.position
            if placement == "after":
                base_position += 1
        elif placement != "append" and not anchor_block_id:
            raise ValueError(
                "Debe proporcionarse 'anchor_block_id' salvo que placement sea 'append'."
            )

        created_block_ids: List[str] = []
        detail: Optional[ChapterDetailPayload] = None
        for index, block_payload in enumerate(serializer.validated_data):
            create_payload = dict(block_payload)
            block_id = uuid4().hex
            create_payload["id"] = block_id
            if base_position is not None:
                create_payload["position"] = base_position + index
            detail = create_chapter_block(chapter_id=chapter.id, payload=create_payload)
            created_block_ids.append(block_id)

        conversion.mark_accepted(block_ids=created_block_ids)

    if detail is None:
        # Safety net: fetch latest chapter detail.
        chapter.refresh_from_db()
        detail = chapter.to_detail_payload()
    return detail
