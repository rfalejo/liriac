from __future__ import annotations

from ..payloads import EditorPayload, build_editor_state
from ..sample_data import DEFAULT_EDITOR_CHAPTER_ID, DEFAULT_EDITOR_TOKEN_BUDGET
from .chapters import get_chapter_detail

__all__ = ["get_editor_state"]


def get_editor_state(chapter_id: str | None = None) -> EditorPayload:
    target_id = chapter_id or DEFAULT_EDITOR_CHAPTER_ID
    detail = get_chapter_detail(target_id)
    if detail is None:
        raise KeyError(f"Unknown chapter: {target_id}")
    return build_editor_state(source=detail, token_budget=DEFAULT_EDITOR_TOKEN_BUDGET)
