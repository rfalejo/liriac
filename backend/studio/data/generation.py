from __future__ import annotations

from typing import Any, Dict, List

from ..models import ChapterBlockType
from ..payloads import BlockConversionBlockPayload

__all__ = ["normalize_generated_blocks"]


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


def normalize_generated_blocks(raw_blocks: Any) -> List[BlockConversionBlockPayload]:
    """Validate and normalise Gemini-generated blocks."""

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
