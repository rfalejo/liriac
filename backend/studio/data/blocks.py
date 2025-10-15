from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4

from django.db import transaction
from django.db.models import F, Max

from ..models import Chapter, ChapterBlock, ChapterBlockType, ChapterBlockVersion
from ..payloads import ChapterDetailPayload

__all__ = [
    "ensure_turn_identifiers",
    "extract_chapter_context_for_block",
    "create_chapter_block",
    "update_chapter_block",
    "delete_chapter_block",
    "list_chapter_block_versions",
    "delete_chapter_block_version",
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
                .select_related("chapter", "chapter__book", "active_version")
                .prefetch_related("versions")
                .get(chapter_id=chapter_id, pk=block_id)
            )
        except ChapterBlock.DoesNotExist as exc:
            raise KeyError(f"Unknown block: {block_id}") from exc

        if "type" in changes and changes["type"] != block.type:
            raise ValueError("El tipo de bloque no puede cambiarse en esta operación.")

        version_hint = changes.get("version")
        if version_hint is not None:
            try:
                version_hint = int(version_hint)
            except (TypeError, ValueError) as exc:  # pragma: no cover - serializer guards
                raise ValueError("El número de versión debe ser un entero válido.") from exc
            if not 1 <= version_hint <= 999:
                raise ValueError("El número de versión debe estar entre 1 y 999.")

        position_changed = False
        if "position" in changes and changes["position"] is not None:
            new_position = int(changes["position"])
            if new_position != block.position:
                block.position = new_position
                position_changed = True

        payload_updates: Dict[str, Any] = {
            key: value
            for key, value in changes.items()
            if key not in {"id", "type", "position", "version"}
        }

        if "turns" in payload_updates and isinstance(payload_updates["turns"], list):
            payload_updates["turns"] = ensure_turn_identifiers(block_id, payload_updates["turns"])

        versions: List[ChapterBlockVersion] = list(block.versions.all())
        if not versions:
            # Safety net: ensure blocks always keep at least one version.
            seed_version = ChapterBlockVersion.objects.create(
                block=block,
                version=1,
                payload=dict(block.payload or {}),
                is_active=True,
            )
            versions = [seed_version]
            block.active_version = seed_version
            block.active_version_number = 1
            block.version_count = 1

        if version_hint is not None:
            base_version = next((item for item in versions if item.version == version_hint), None)
            if base_version is None:
                raise KeyError(f"Unknown version {version_hint} for block {block_id}")
        else:
            base_version = block.active_version or versions[0]

        base_payload = dict(base_version.payload or {})
        merged_payload = dict(base_payload)
        merged_payload.update(payload_updates)

        payload_changed = merged_payload != base_payload

        target_version: Optional[ChapterBlockVersion] = None
        for candidate in versions:
            if dict(candidate.payload or {}) == merged_payload:
                target_version = candidate
                break

        created_new_version = False
        if payload_changed and target_version is None:
            next_version_number = max(version.version for version in versions) + 1
            if next_version_number > 999:
                raise ValueError("No se pueden crear más de 999 versiones para este bloque.")

            target_version = ChapterBlockVersion.objects.create(
                block=block,
                version=next_version_number,
                payload=merged_payload,
                is_active=True,
            )
            versions.append(target_version)
            created_new_version = True

        if target_version is None:
            target_version = base_version

        # Activate selected version if needed.
        if block.active_version_id != target_version.id:
            ChapterBlockVersion.objects.filter(block=block, is_active=True).exclude(
                pk=target_version.id
            ).update(is_active=False)
            if not target_version.is_active:
                target_version.is_active = True
                target_version.save(update_fields=["is_active", "updated_at"])
            block.active_version = target_version
            block.active_version_number = int(target_version.version)

        block.payload = dict(target_version.payload or {})

        desired_version_count = len(versions)
        if block.version_count != desired_version_count:
            block.version_count = desired_version_count

        update_fields = ["updated_at"]
        if position_changed:
            update_fields.append("position")
        if created_new_version or payload_changed or block.active_version_id == target_version.id:
            update_fields.extend(
                ["payload", "active_version", "active_version_number", "version_count"]
            )
        else:
            # Ensure payload stays in sync when only changing version selection
            update_fields.extend(
                ["payload", "active_version", "active_version_number", "version_count"]
            )

        block.save(update_fields=list(dict.fromkeys(update_fields)))

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


def list_chapter_block_versions(
    chapter_id: str,
    block_id: str,
) -> List[Dict[str, Any]]:
    try:
        block = (
            ChapterBlock.objects.select_related("chapter")
            .prefetch_related("versions")
            .get(chapter_id=chapter_id, pk=block_id)
        )
    except ChapterBlock.DoesNotExist as exc:
        raise KeyError(f"Unknown block: {block_id}") from exc

    versions = sorted(block.versions.all(), key=lambda item: item.version)
    return [version.to_payload() for version in versions]


def delete_chapter_block_version(
    chapter_id: str,
    block_id: str,
    version_number: int,
) -> ChapterDetailPayload:
    with transaction.atomic():
        try:
            block = (
                ChapterBlock.objects.select_for_update()
                .select_related("chapter", "chapter__book", "active_version")
                .prefetch_related("versions")
                .get(chapter_id=chapter_id, pk=block_id)
            )
        except ChapterBlock.DoesNotExist as exc:
            raise KeyError(f"Unknown block: {block_id}") from exc

        versions = list(block.versions.all())
        if len(versions) <= 1:
            raise ValueError("No se puede eliminar la única versión del bloque.")

        target = next((item for item in versions if item.version == version_number), None)
        if target is None:
            raise KeyError(f"Unknown version {version_number} for block {block_id}")

        target.delete()
        versions = [item for item in versions if item.version != version_number]

        block.version_count = len(versions)

        active_version = block.active_version
        if active_version is None or active_version.version == version_number:
            # Prefer the highest remaining version, otherwise fallback to first.
            fallback = None
            for candidate in sorted(versions, key=lambda item: item.version, reverse=True):
                if candidate.pk and candidate.version != version_number:
                    fallback = candidate
                    break
            if fallback is None and versions:
                fallback = versions[-1]
            if fallback is None:
                raise ValueError("No hay versiones disponibles para activar tras la eliminación.")

            ChapterBlockVersion.objects.filter(block=block).exclude(pk=fallback.pk).update(
                is_active=False
            )
            if not fallback.is_active:
                fallback.is_active = True
                fallback.save(update_fields=["is_active", "updated_at"])
            block.active_version = fallback
            block.active_version_number = int(fallback.version)
            block.payload = dict(fallback.payload or {})
        else:
            # Ensure the persisted payload stays in sync with the active version.
            block.payload = dict(active_version.payload or {})
            ChapterBlockVersion.objects.filter(block=block, is_active=True).exclude(
                pk=active_version.pk
            ).update(is_active=False)

        block.save(
            update_fields=[
                "payload",
                "active_version",
                "active_version_number",
                "version_count",
                "updated_at",
            ]
        )

        chapter = block.chapter
    return chapter.to_detail_payload()


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

        payload_data: Dict[str, Any] = dict(payload_updates)

        block = ChapterBlock.objects.create(
            id=block_id,
            chapter=chapter,
            type=block_type,
            position=position,
            payload=payload_data,
            version_count=1,
            active_version_number=1,
        )

        version = ChapterBlockVersion.objects.create(
            block=block,
            version=1,
            payload=payload_data,
            is_active=True,
        )
        block.active_version = version
        block.save(update_fields=["active_version", "updated_at"])

    return (
        Chapter.objects.select_related("book").prefetch_related("blocks").get(pk=chapter_id)
    ).to_detail_payload()
