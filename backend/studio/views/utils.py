from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from ..models import ChapterBlockType

__all__ = [
    "coerce_optional_text",
    "normalize_theme_tags",
    "flatten_structured_block_fields",
]


def coerce_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def normalize_theme_tags(tags: Optional[Iterable[str]]) -> Optional[list[str]]:
    if tags is None:
        return None
    normalized = []
    for item in tags:
        if item is None:
            continue
        text = str(item).strip()
        if text:
            normalized.append(text)
    return normalized


def flatten_structured_block_fields(
    payload: Dict[str, Any],
    *,
    block_type: Optional[str],
    block_kind: Optional[str],
) -> Dict[str, Any]:
    if not payload:
        return payload

    flattened = dict(payload)
    block_type_value = str(block_type) if block_type is not None else None
    block_kind_value = str(block_kind) if block_kind is not None else None

    narrative_context = flattened.pop("narrativeContext", None)
    if (
        narrative_context is not None
        and block_type_value == ChapterBlockType.METADATA
        and (
            block_kind_value == "context"
            or block_kind_value is None
            or isinstance(narrative_context, dict)
        )
    ):
        if isinstance(narrative_context, dict):
            if "povCharacterId" in narrative_context:
                flattened["povCharacterId"] = coerce_optional_text(
                    narrative_context.get("povCharacterId")
                )
            if "povCharacterName" in narrative_context:
                flattened["povCharacterName"] = coerce_optional_text(
                    narrative_context.get("povCharacterName")
                )
            if "timelineMarker" in narrative_context:
                flattened["timelineMarker"] = coerce_optional_text(
                    narrative_context.get("timelineMarker")
                )
            if "locationId" in narrative_context:
                flattened["locationId"] = coerce_optional_text(narrative_context.get("locationId"))
            if "locationName" in narrative_context:
                flattened["locationName"] = coerce_optional_text(
                    narrative_context.get("locationName")
                )
            if "themeTags" in narrative_context:
                tags = normalize_theme_tags(narrative_context.get("themeTags"))
                if tags is None:
                    flattened["themeTags"] = []
                else:
                    flattened["themeTags"] = tags

    scene_details = flattened.pop("sceneDetails", None)
    if scene_details is not None and block_type_value == ChapterBlockType.SCENE_BOUNDARY:
        if isinstance(scene_details, dict):
            if "locationId" in scene_details:
                flattened["locationId"] = coerce_optional_text(scene_details.get("locationId"))
            if "locationName" in scene_details:
                flattened["locationName"] = coerce_optional_text(scene_details.get("locationName"))
            if "timestamp" in scene_details:
                flattened["timestamp"] = coerce_optional_text(scene_details.get("timestamp"))
            if "mood" in scene_details:
                flattened["mood"] = coerce_optional_text(scene_details.get("mood"))

    return flattened
