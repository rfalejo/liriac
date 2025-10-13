from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4

from django.db import transaction
from django.db.models import F, Max

from ..models import Chapter, ChapterBlock, ChapterBlockType
from ..payloads import ChapterDetailPayload

__all__ = [
    "ensure_turn_identifiers",
    "extract_chapter_context_for_block",
    "create_chapter_block",
    "update_chapter_block",
    "delete_chapter_block",
]


def ensure_turn_identifiers(block_id: str, turns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for index, turn in enumerate(turns):
        copy = dict(turn)
        candidate = copy.get("id") or f"{block_id}-turn-{index + 1:02d}"
        while candidate in seen:
            candidate = f"{block_id}-turn-{uuid4().hex[:8]}"
        copy["id"] = candidate
        seen.add(candidate)
        normalized.append(copy)
    return normalized


def extract_chapter_context_for_block(
    chapter: ChapterDetailPayload,
    block_id: Optional[str],
) -> Dict[str, Any]:
    blocks = chapter.get("blocks", [])
    sorted_blocks = sorted(blocks, key=lambda b: b.get("position", 0))

    metadata_block = None
    for block in sorted_blocks:
        if block.get("type") != "metadata":
            continue
        if metadata_block is None:
            metadata_block = block
        if block.get("kind") == "context":
            metadata_block = block
            break

    if not block_id:
        return {
            "metadata_block": metadata_block,
            "scene_block": None,
            "preceding_blocks": [],
            "following_blocks": [],
        }

    target_index = None
    for idx, block in enumerate(sorted_blocks):
        if block.get("id") == block_id:
            target_index = idx
            break

    if target_index is None:
        return {
            "metadata_block": metadata_block,
            "scene_block": None,
            "preceding_blocks": [],
            "following_blocks": [],
        }

    scene_block = None
    for idx in range(target_index - 1, -1, -1):
        if sorted_blocks[idx].get("type") == "scene_boundary":
            scene_block = sorted_blocks[idx]
            break

    preceding_blocks = []
    count = 0
    for idx in range(target_index - 1, -1, -1):
        if count >= 3:
            break
        block = sorted_blocks[idx]
        block_type = block.get("type")
        if block_type in {"metadata", "scene_boundary"}:
            continue
        preceding_blocks.insert(0, block)
        count += 1

    following_blocks = []
    for idx in range(target_index + 1, min(target_index + 3, len(sorted_blocks))):
        block = sorted_blocks[idx]
        if block.get("type") in {"metadata", "scene_boundary"}:
            continue
        following_blocks.append(block)

    return {
        "metadata_block": metadata_block,
        "scene_block": scene_block,
        "preceding_blocks": preceding_blocks,
        "following_blocks": following_blocks,
    }


def update_chapter_block(
    chapter_id: str,
    block_id: str,
    changes: Dict[str, Any],
) -> ChapterDetailPayload:
    with transaction.atomic():
        try:
            block = (
                ChapterBlock.objects.select_for_update()
                .select_related("chapter", "chapter__book")
                .get(chapter_id=chapter_id, pk=block_id)
            )
        except ChapterBlock.DoesNotExist as exc:
            raise KeyError(f"Unknown block: {block_id}") from exc

        if "type" in changes and changes["type"] != block.type:
            raise ValueError("El tipo de bloque no puede cambiarse en esta operación.")

        if "position" in changes:
            block.position = int(changes["position"])

        payload_updates: Dict[str, Any] = {
            key: value for key, value in changes.items() if key not in {"id", "type", "position"}
        }
        if "turns" in payload_updates and isinstance(payload_updates["turns"], list):
            payload_updates["turns"] = ensure_turn_identifiers(block_id, payload_updates["turns"])

        merged_payload = dict(block.payload or {})
        merged_payload.update(payload_updates)
        block.payload = merged_payload
        block.save(update_fields=["position", "payload", "updated_at"])

        chapter = block.chapter
    return chapter.to_detail_payload()


def delete_chapter_block(
    chapter_id: str,
    block_id: str,
) -> ChapterDetailPayload:
    with transaction.atomic():
        try:
            block = (
                ChapterBlock.objects.select_for_update()
                .select_related("chapter", "chapter__book")
                .get(chapter_id=chapter_id, pk=block_id)
            )
        except ChapterBlock.DoesNotExist as exc:
            raise KeyError(f"Unknown block: {block_id}") from exc

        chapter = block.chapter
        position = block.position
        block.delete()

        ChapterBlock.objects.filter(
            chapter=chapter,
            position__gt=position,
        ).update(position=F("position") - 1)

    return (
        Chapter.objects.select_related("book").prefetch_related("blocks").get(pk=chapter_id)
    ).to_detail_payload()


def create_chapter_block(
    chapter_id: str,
    payload: Dict[str, Any],
) -> ChapterDetailPayload:
    with transaction.atomic():
        try:
            chapter = (
                Chapter.objects.select_for_update()
                .select_related("book")
                .prefetch_related("blocks")
                .get(pk=chapter_id)
            )
        except Chapter.DoesNotExist as exc:
            raise KeyError(f"Unknown chapter: {chapter_id}") from exc

        block_type = str(payload.get("type"))
        if block_type not in ChapterBlockType.values:
            raise ValueError("Tipo de bloque no soportado.")

        block_id = str(payload.get("id") or uuid4().hex)

        if ChapterBlock.objects.filter(pk=block_id).exists():
            raise ValueError("Ya existe un bloque con ese identificador.")

        raw_position = payload.get("position")
        if raw_position is None:
            current_max = chapter.blocks.aggregate(Max("position")).get("position__max")
            position = (int(current_max) + 1) if current_max is not None else 0
        else:
            position = int(raw_position)
            ChapterBlock.objects.filter(
                chapter=chapter,
                position__gte=position,
            ).update(position=F("position") + 1)

        payload_updates: Dict[str, Any] = {
            key: value for key, value in payload.items() if key not in {"id", "type", "position"}
        }

        if block_type == ChapterBlockType.DIALOGUE:
            turns = payload_updates.get("turns")
            if turns is None:
                turns = []
            if not isinstance(turns, list):
                raise ValueError("Los turnos de diálogo deben enviarse como lista.")
            payload_updates["turns"] = ensure_turn_identifiers(block_id, turns)

        ChapterBlock.objects.create(
            id=block_id,
            chapter=chapter,
            type=block_type,
            position=position,
            payload=payload_updates,
        )

    return (
        Chapter.objects.select_related("book").prefetch_related("blocks").get(pk=chapter_id)
    ).to_detail_payload()
