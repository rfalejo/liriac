from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Optional
from uuid import uuid4

from django.db import IntegrityError, transaction
from django.db.models import Max

from ..models import Book, Chapter
from ..payloads import (
    ChapterDetailPayload,
    ChapterSummaryPayload,
    chapter_detail_from_blocks,
)
from ..sample_data import SAMPLE_CHAPTER_BLOCKS, SAMPLE_CHAPTER_METADATA

__all__ = [
    "get_chapter_detail",
    "create_chapter",
    "update_chapter",
]


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


def _next_chapter_ordinal(book: Book) -> int:
    current_max = book.chapters.aggregate(Max("ordinal")).get("ordinal__max")
    if current_max is None:
        return 0
    return int(current_max) + 1


def create_chapter(
    *,
    book_id: str,
    title: str,
    summary: Optional[str] = None,
    ordinal: Optional[int] = None,
    tokens: Optional[int] = None,
    word_count: Optional[int] = None,
    chapter_id: Optional[str] = None,
) -> ChapterSummaryPayload:
    with transaction.atomic():
        try:
            book = Book.objects.select_for_update().get(pk=book_id)
        except Book.DoesNotExist as exc:
            raise KeyError(f"Unknown book: {book_id}") from exc

        effective_ordinal = _next_chapter_ordinal(book) if ordinal is None else int(ordinal)

        try:
            chapter = Chapter.objects.create(
                id=chapter_id or uuid4().hex,
                book=book,
                title=title,
                summary=summary or "",
                ordinal=effective_ordinal,
                tokens=int(tokens) if tokens is not None else None,
                word_count=int(word_count) if word_count is not None else None,
            )
        except IntegrityError as exc:
            raise ValueError("Ya existe un capítulo con ese identificador.") from exc

    return chapter.to_summary_payload()


def update_chapter(chapter_id: str, changes: Dict[str, Any]) -> ChapterSummaryPayload:
    with transaction.atomic():
        try:
            chapter = Chapter.objects.select_for_update().get(pk=chapter_id)
        except Chapter.DoesNotExist as exc:
            raise KeyError(f"Unknown chapter: {chapter_id}") from exc

        fields_to_update: list[str] = []

        if "title" in changes and changes["title"] is not None:
            chapter.title = str(changes["title"])
            fields_to_update.append("title")

        if "summary" in changes:
            chapter.summary = str(changes["summary"] or "")
            fields_to_update.append("summary")

        if "ordinal" in changes and changes["ordinal"] is not None:
            chapter.ordinal = int(changes["ordinal"])
            fields_to_update.append("ordinal")

        if "tokens" in changes:
            tokens = changes["tokens"]
            chapter.tokens = int(tokens) if tokens is not None else None
            fields_to_update.append("tokens")

        if "word_count" in changes:
            word_count = changes["word_count"]
            chapter.word_count = int(word_count) if word_count is not None else None
            fields_to_update.append("word_count")

        if fields_to_update:
            chapter.save(update_fields=fields_to_update)

    return chapter.to_summary_payload()
