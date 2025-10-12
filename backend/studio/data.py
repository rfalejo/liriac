from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List, Optional, cast
from uuid import uuid4

from django.db import transaction

from .models import (
    Book,
    Chapter,
    ChapterBlock,
    LibraryContextItem,
    LibrarySection,
)
from .payloads import (
    ChapterDetailPayload,
    ContextSectionPayload,
    EditorPayload,
    LibraryBookPayload,
    build_editor_state,
    chapter_detail_from_blocks,
)
from .sample_data import (
    DEFAULT_EDITOR_CHAPTER_ID,
    DEFAULT_EDITOR_TOKEN_BUDGET,
    SAMPLE_CHAPTER_BLOCKS,
    SAMPLE_CHAPTER_METADATA,
    SAMPLE_LIBRARY_BOOKS,
    SAMPLE_LIBRARY_SECTIONS,
)


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


def get_library_sections() -> List[ContextSectionPayload]:
    sections = LibrarySection.objects.prefetch_related("items").order_by("order", "id").all()
    if not sections:
        return cast(List[ContextSectionPayload], deepcopy(SAMPLE_LIBRARY_SECTIONS))
    return [section.to_payload() for section in sections]


def get_library_books() -> List[LibraryBookPayload]:
    books = Book.objects.prefetch_related("chapters").order_by("order", "title")
    if not books:
        return cast(List[LibraryBookPayload], deepcopy(SAMPLE_LIBRARY_BOOKS))
    return [book.to_payload() for book in books]


def _build_sample_chapter_detail(chapter_id: str) -> Optional[ChapterDetailPayload]:
    metadata = SAMPLE_CHAPTER_METADATA.get(chapter_id)
    if metadata is None:
        return None
    blocks = deepcopy(SAMPLE_CHAPTER_BLOCKS.get(chapter_id, []))
    return chapter_detail_from_blocks(
        chapter_id=chapter_id,
        title=str(metadata.get("title", "")),
        summary=metadata.get("summary"),
        ordinal=int(metadata.get("ordinal", 0)),
        tokens=metadata.get("tokens"),
        word_count=metadata.get("word_count"),
        blocks=blocks,
        book_id=metadata.get("book_id"),
        book_title=metadata.get("book_title"),
    )


def get_chapter_detail(chapter_id: str) -> Optional[ChapterDetailPayload]:
    try:
        chapter = (
            Chapter.objects.select_related("book").prefetch_related("blocks").get(pk=chapter_id)
        )
    except Chapter.DoesNotExist:
        return _build_sample_chapter_detail(chapter_id)
    return chapter.to_detail_payload()


def get_editor_state(chapter_id: Optional[str] = None) -> EditorPayload:
    target_id = chapter_id or DEFAULT_EDITOR_CHAPTER_ID
    detail = get_chapter_detail(target_id)
    if detail is None:
        raise KeyError(f"Unknown chapter: {target_id}")
    return build_editor_state(source=detail, token_budget=DEFAULT_EDITOR_TOKEN_BUDGET)


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


def bootstrap_sample_data(*, force: bool = False, apps=None) -> None:
    BookModel = Book if apps is None else apps.get_model("studio", "Book")
    ChapterModel = Chapter if apps is None else apps.get_model("studio", "Chapter")
    ChapterBlockModel = ChapterBlock if apps is None else apps.get_model("studio", "ChapterBlock")
    LibrarySectionModel = (
        LibrarySection if apps is None else apps.get_model("studio", "LibrarySection")
    )
    LibraryContextItemModel = (
        LibraryContextItem if apps is None else apps.get_model("studio", "LibraryContextItem")
    )

    with transaction.atomic():
        if not force and LibrarySectionModel.objects.exists():
            return

        if force:
            LibraryContextItemModel.objects.all().delete()
            LibrarySectionModel.objects.all().delete()
            ChapterBlockModel.objects.all().delete()
            ChapterModel.objects.all().delete()
            BookModel.objects.all().delete()

        for order, section in enumerate(SAMPLE_LIBRARY_SECTIONS):
            section_obj, _ = LibrarySectionModel.objects.update_or_create(
                id=section["id"],
                defaults={
                    "title": section.get("title", ""),
                    "default_open": bool(section.get("defaultOpen", False)),
                    "order": order,
                },
            )
            items = section.get("items", [])
            for item_order, item in enumerate(items):
                defaults: Dict[str, Any] = {
                    "item_type": item.get("type", "chapter"),
                    "name": item.get("name", ""),
                    "role": item.get("role", ""),
                    "summary": item.get("summary", ""),
                    "title": item.get("title", ""),
                    "description": item.get("description", ""),
                    "facts": item.get("facts", ""),
                    "tokens": item.get("tokens"),
                    "checked": bool(item.get("checked", False)),
                    "disabled": bool(item.get("disabled", False)),
                    "order": item_order,
                }
                LibraryContextItemModel.objects.update_or_create(
                    section=section_obj,
                    item_id=item.get("id", f"{section_obj.id}-{item_order}"),
                    defaults=defaults,
                )

        book_objects: Dict[str, Any] = {}
        for order, book in enumerate(SAMPLE_LIBRARY_BOOKS):
            book_obj, _ = BookModel.objects.update_or_create(
                id=book["id"],
                defaults={
                    "title": book.get("title", ""),
                    "author": book.get("author", ""),
                    "synopsis": book.get("synopsis", ""),
                    "order": order,
                },
            )
            book_objects[book_obj.id] = book_obj
            for chapter in book.get("chapters", []):
                chapter_obj, _ = ChapterModel.objects.update_or_create(
                    id=chapter["id"],
                    defaults={
                        "book": book_obj,
                        "title": chapter.get("title", ""),
                        "summary": chapter.get("summary", ""),
                        "ordinal": int(chapter.get("ordinal", 0)),
                        "tokens": chapter.get("tokens"),
                        "word_count": chapter.get("wordCount"),
                    },
                )
                blocks = SAMPLE_CHAPTER_BLOCKS.get(chapter_obj.id, [])
                for block in blocks:
                    payload = {
                        key: value
                        for key, value in block.items()
                        if key not in {"id", "type", "position"}
                    }
                    ChapterBlockModel.objects.update_or_create(
                        id=block["id"],
                        defaults={
                            "chapter": chapter_obj,
                            "type": block.get("type", "paragraph"),
                            "position": int(block.get("position", 0)),
                            "payload": payload,
                        },
                    )

        # Ensure there is at least one chapter for editor defaults
        if not ChapterModel.objects.filter(id=DEFAULT_EDITOR_CHAPTER_ID).exists():
            metadata = SAMPLE_CHAPTER_METADATA.get(DEFAULT_EDITOR_CHAPTER_ID)
            if metadata:
                book_obj = book_objects.get(metadata.get("book_id"))
                if book_obj is None and metadata.get("book_id"):
                    book_obj, _ = BookModel.objects.get_or_create(
                        id=metadata["book_id"],
                        defaults={"title": metadata.get("book_title", metadata["book_id"])},
                    )
                    book_objects[book_obj.id] = book_obj
                chapter_obj, _ = ChapterModel.objects.update_or_create(
                    id=DEFAULT_EDITOR_CHAPTER_ID,
                    defaults={
                        "book": book_obj,
                        "title": metadata.get("title", ""),
                        "summary": metadata.get("summary", ""),
                        "ordinal": int(metadata.get("ordinal", 0)),
                        "tokens": metadata.get("tokens"),
                        "word_count": metadata.get("word_count"),
                    },
                )
                blocks = SAMPLE_CHAPTER_BLOCKS.get(DEFAULT_EDITOR_CHAPTER_ID, [])
                for block in blocks:
                    payload = {
                        key: value
                        for key, value in block.items()
                        if key not in {"id", "type", "position"}
                    }
                    ChapterBlockModel.objects.update_or_create(
                        id=block["id"],
                        defaults={
                            "chapter": chapter_obj,
                            "type": block.get("type", "paragraph"),
                            "position": int(block.get("position", 0)),
                            "payload": payload,
                        },
                    )
