from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Iterable, List, Optional, cast
from uuid import uuid4

from django.db import IntegrityError, transaction
from django.db.models import F, Max, Q

from .models import (
    Book,
    Chapter,
    ChapterBlock,
    ChapterBlockType,
    ContextItemType,
    LibraryContextItem,
    LibrarySection,
)
from .payloads import (
    ChapterDetailPayload,
    ChapterSummaryPayload,
    ContextItemPayload,
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


def _section_templates_for_book(book_id: str) -> List[Dict[str, Any]]:
    template_source = deepcopy(SAMPLE_LIBRARY_SECTIONS)
    sample_book_ids = {book.get("id") for book in SAMPLE_LIBRARY_BOOKS}

    if book_id in sample_book_ids:
        return cast(List[Dict[str, Any]], template_source)

    # Provide empty templates (no default items) for non-sample books so users can
    # populate their own context.
    templates: List[Dict[str, Any]] = []
    for section in template_source:
        templates.append(  # type: ignore[arg-type]
            {
                "id": section.get("id"),
                "slug": section.get("slug") or section.get("id"),
                "title": section.get("title"),
                "defaultOpen": section.get("defaultOpen", False),
                "items": [],
            }
        )
    return templates


def _ensure_book_context_sections(book: Book) -> List[LibrarySection]:
    sections = list(
        LibrarySection.objects.prefetch_related("items")
        .filter(book=book)
        .order_by("order", "slug", "id")
    )
    if sections:
        return sections

    templates = _section_templates_for_book(book.id)
    created_sections: List[LibrarySection] = []

    for order, template in enumerate(templates):
        slug = str(template.get("slug") or template.get("id") or f"section-{order}")
        section = LibrarySection.objects.create(
            id=uuid4().hex,
            book=book,
            slug=slug,
            title=str(template.get("title") or slug.title()),
            default_open=bool(template.get("defaultOpen", False)),
            order=int(template.get("order", order)),
        )

        for item_order, raw_item in enumerate(cast(Iterable[Dict[str, Any]], template.get("items", []))):
            LibraryContextItem.objects.create(
                section=section,
                chapter=None,
                item_id=str(raw_item.get("id") or f"{slug}-{item_order}"),
                item_type=str(raw_item.get("type") or "chapter"),
                name=str(raw_item.get("name") or ""),
                role=str(raw_item.get("role") or ""),
                summary=str(raw_item.get("summary") or ""),
                title=str(raw_item.get("title") or ""),
                description=str(raw_item.get("description") or ""),
                facts=str(raw_item.get("facts") or ""),
                tokens=raw_item.get("tokens"),
                checked=bool(raw_item.get("checked", False)),
                disabled=bool(raw_item.get("disabled", False)),
                order=item_order,
            )

        created_sections.append(section)

    return created_sections


def get_book_context_sections(
    book_id: str,
    *,
    chapter_id: Optional[str] = None,
) -> List[ContextSectionPayload]:
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return []

    sections = _ensure_book_context_sections(book)

    chapter_specific_items: Dict[str, List[ContextItemPayload]] = {}
    if chapter_id:
        chapter_specific_items = {}
        for item in LibraryContextItem.objects.filter(
            section__book=book,
            chapter_id=chapter_id,
        ).order_by("section__order", "order"):
            chapter_specific_items.setdefault(item.section.slug, []).append(item.to_payload())

    payloads: List[ContextSectionPayload] = []
    for section in sections:
        base_items = [
            item.to_payload()
            for item in section.items.all()
            if item.chapter_id is None
        ]

        if chapter_id:
            extra_items = chapter_specific_items.get(section.slug, [])
            items = base_items + extra_items
        else:
            items = base_items

        payload = dict(section.to_payload())
        payload["items"] = items
        payloads.append(cast(ContextSectionPayload, payload))

    return payloads


def _coerce_optional_text(value: Optional[str]) -> str:
    if value in {None, ""}:
        return ""
    return str(value)


def create_book_context_item(
    book_id: str,
    payload: Dict[str, Any],
) -> List[ContextSectionPayload]:
    section_slug = str(payload["sectionSlug"])
    item_type = str(payload["type"])

    if item_type not in ContextItemType.values:
        raise ValueError("Tipo de elemento de contexto no soportado.")

    with transaction.atomic():
        try:
            book = Book.objects.select_for_update().get(pk=book_id)
        except Book.DoesNotExist as exc:
            raise KeyError(f"Unknown book: {book_id}") from exc

        # Ensure sections exist for the book before locating the target slug
        _ensure_book_context_sections(book)

        try:
            section = (
                LibrarySection.objects.select_for_update()
                .get(book=book, slug=section_slug)
            )
        except LibrarySection.DoesNotExist as exc:
            raise KeyError(f"Unknown context section: {section_slug}") from exc

        chapter_id_raw = payload.get("chapterId")
        if chapter_id_raw:
            chapter_id = str(chapter_id_raw)
            try:
                chapter = Chapter.objects.get(pk=chapter_id, book=book)
            except Chapter.DoesNotExist as exc:
                raise KeyError(f"Unknown chapter for context item: {chapter_id}") from exc
        else:
            chapter = None

        requested_id = payload.get("id")
        item_id = str(requested_id) if requested_id else uuid4().hex

        if LibraryContextItem.objects.filter(section=section, item_id=item_id).exists():
            raise ValueError("Ya existe un elemento de contexto con ese identificador.")

        current_max = (
            LibraryContextItem.objects.filter(section=section).aggregate(Max("order"))
        ).get("order__max")
        next_order = (int(current_max) + 1) if current_max is not None else 0

        tokens_raw = payload.get("tokens")
        tokens_value = None
        if tokens_raw not in {None, ""}:
            tokens_value = int(tokens_raw)

        LibraryContextItem.objects.create(
            section=section,
            chapter=chapter,
            item_id=item_id,
            item_type=item_type,
            name=_coerce_optional_text(payload.get("name")),
            role=_coerce_optional_text(payload.get("role")),
            summary=_coerce_optional_text(payload.get("summary")),
            title=_coerce_optional_text(payload.get("title")),
            description=_coerce_optional_text(payload.get("description")),
            facts=_coerce_optional_text(payload.get("facts")),
            tokens=tokens_value,
            checked=bool(payload.get("checked", False)),
            disabled=bool(payload.get("disabled", False)),
            order=next_order,
        )

    return get_book_context_sections(book_id)


def get_active_context_items(
    *,
    book_id: str,
    chapter_id: Optional[str] = None,
) -> List[ContextItemPayload]:
    """Retrieve checked context items scoped to a book (and optionally a chapter)."""

    filters = Q(section__book_id=book_id, checked=True, disabled=False)
    if chapter_id:
        filters &= Q(Q(chapter__isnull=True) | Q(chapter_id=chapter_id))
    else:
        filters &= Q(chapter__isnull=True)

    items = LibraryContextItem.objects.filter(filters).order_by("section__order", "order")
    return [item.to_payload() for item in items]


def get_library_books() -> List[LibraryBookPayload]:
    books = Book.objects.prefetch_related("chapters").order_by("order", "title")
    if not books:
        return cast(List[LibraryBookPayload], deepcopy(SAMPLE_LIBRARY_BOOKS))
    return [book.to_payload() for book in books]


def get_book_metadata(book_id: str) -> Optional[Dict[str, Any]]:
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        sample = next((item for item in SAMPLE_LIBRARY_BOOKS if item.get("id") == book_id), None)
        if sample is None:
            return None
        return {
            "id": sample.get("id", book_id),
            "title": sample.get("title"),
            "author": sample.get("author"),
            "synopsis": sample.get("synopsis"),
        }

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author or None,
        "synopsis": book.synopsis or None,
    }


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


def extract_chapter_context_for_block(
    chapter: ChapterDetailPayload,
    block_id: Optional[str],
) -> Dict[str, Any]:
    """Extract contextual blocks around a target block for AI prompting.

    Returns a dictionary with:
    - metadata_block: The chapter's metadata block (if exists)
    - scene_block: The nearest scene boundary before the target block
    - preceding_blocks: 2-3 blocks immediately before the target
    - following_blocks: 1-2 blocks immediately after the target
    """
    blocks = chapter.get("blocks", [])
    sorted_blocks = sorted(blocks, key=lambda b: b.get("position", 0))

    # Find metadata block (usually at position 0)
    metadata_block = None
    for block in sorted_blocks:
        if block.get("type") != "metadata":
            continue
        if metadata_block is None:
            metadata_block = block
        if block.get("kind") == "context":
            metadata_block = block
            break

    # If no block_id specified, return just metadata and no surrounding blocks
    if not block_id:
        return {
            "metadata_block": metadata_block,
            "scene_block": None,
            "preceding_blocks": [],
            "following_blocks": [],
        }

    # Find target block position
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

    # Find nearest scene boundary before target
    scene_block = None
    for idx in range(target_index - 1, -1, -1):
        if sorted_blocks[idx].get("type") == "scene_boundary":
            scene_block = sorted_blocks[idx]
            break

    # Get preceding blocks (up to 3, excluding metadata and scene boundaries in the immediate context)
    preceding_blocks = []
    count = 0
    for idx in range(target_index - 1, -1, -1):
        if count >= 3:
            break
        block = sorted_blocks[idx]
        block_type = block.get("type")
        # Skip metadata and scene boundaries to avoid duplicating context sections
        if block_type in {"metadata", "scene_boundary"}:
            continue
        preceding_blocks.insert(0, block)
        count += 1

    # Get following blocks (up to 2)
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


def _next_book_order() -> int:
    current_max = Book.objects.aggregate(Max("order")).get("order__max")
    if current_max is None:
        return 0
    return int(current_max) + 1


def _next_chapter_ordinal(book: Book) -> int:
    current_max = book.chapters.aggregate(Max("ordinal")).get("ordinal__max")
    if current_max is None:
        return 0
    return int(current_max) + 1


def create_book(
    *,
    title: str,
    author: Optional[str] = None,
    synopsis: Optional[str] = None,
    order: Optional[int] = None,
    book_id: Optional[str] = None,
) -> LibraryBookPayload:
    with transaction.atomic():
        effective_order = _next_book_order() if order is None else int(order)
        try:
            book = Book.objects.create(
                id=book_id or uuid4().hex,
                title=title,
                author=author or "",
                synopsis=synopsis or "",
                order=effective_order,
            )
        except IntegrityError as exc:
            raise ValueError("Ya existe un libro con ese identificador.") from exc

        _ensure_book_context_sections(book)
    return book.to_payload()


def update_book(book_id: str, changes: Dict[str, Any]) -> LibraryBookPayload:
    with transaction.atomic():
        try:
            book = Book.objects.select_for_update().prefetch_related("chapters").get(pk=book_id)
        except Book.DoesNotExist as exc:
            raise KeyError(f"Unknown book: {book_id}") from exc

        fields_to_update: List[str] = []

        if "title" in changes and changes["title"] is not None:
            book.title = str(changes["title"])
            fields_to_update.append("title")

        if "author" in changes:
            book.author = str(changes["author"] or "")
            fields_to_update.append("author")

        if "synopsis" in changes:
            book.synopsis = str(changes["synopsis"] or "")
            fields_to_update.append("synopsis")

        if "order" in changes and changes["order"] is not None:
            book.order = int(changes["order"])
            fields_to_update.append("order")

        if fields_to_update:
            book.save(update_fields=fields_to_update)

    return book.to_payload()


def delete_book(book_id: str) -> None:
    with transaction.atomic():
        deleted_count, _ = Book.objects.filter(pk=book_id).delete()
        if deleted_count == 0:
            raise KeyError(f"Unknown book: {book_id}")


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

        fields_to_update: List[str] = []

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


def update_book_context_items(
    book_id: str,
    updates: List[Dict[str, Any]],
) -> List[ContextSectionPayload]:
    if not updates:
        return get_book_context_sections(book_id)

    editable_fields = {
        "name": "name",
        "role": "role",
        "summary": "summary",
        "title": "title",
        "description": "description",
        "facts": "facts",
    }

    with transaction.atomic():
        for update in updates:
            section_slug = str(update["sectionSlug"])
            item_id = str(update["id"])
            chapter_id = update.get("chapterId")

            try:
                item = (
                    LibraryContextItem.objects.select_for_update()
                    .select_related("section")
                    .get(
                        section__book_id=book_id,
                        section__slug=section_slug,
                        item_id=item_id,
                        **(
                            {"chapter_id": str(chapter_id)}
                            if chapter_id is not None
                            else {"chapter__isnull": True}
                        ),
                    )
                )
            except LibraryContextItem.DoesNotExist as exc:
                scope = section_slug if chapter_id is None else f"{section_slug}:{chapter_id}"
                raise KeyError(f"Unknown context item: {scope}:{item_id}") from exc

            fields_to_update: List[str] = []

            for field, model_field in editable_fields.items():
                if field not in update:
                    continue

                raw_value = update[field]
                coerced = "" if raw_value in {None, ""} else str(raw_value)
                setattr(item, model_field, coerced)
                fields_to_update.append(model_field)

            if fields_to_update:
                item.save(update_fields=fields_to_update + ["updated_at"])

    return get_book_context_sections(book_id)


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

    section_has_book_field = any(field.name == "book" for field in LibrarySectionModel._meta.fields)
    context_item_has_chapter_field = any(
        field.name == "chapter" for field in LibraryContextItemModel._meta.fields
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

        if not section_has_book_field:
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
                    defaults = {
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
            return

        for book_obj in BookModel.objects.all():
            templates = _section_templates_for_book(book_obj.id)
            for order, template in enumerate(templates):
                slug = str(template.get("slug") or template.get("id") or f"section-{order}")
                section_pk = f"{book_obj.id}-{slug}"
                if len(section_pk) > 64:
                    section_pk = section_pk[:64]

                section_defaults = {
                    "book": book_obj,
                    "slug": slug,
                    "title": template.get("title", ""),
                    "default_open": bool(template.get("defaultOpen", False)),
                    "order": int(template.get("order", order)),
                }
                section_obj, _ = LibrarySectionModel.objects.update_or_create(
                    id=section_pk,
                    defaults=section_defaults,
                )

                items = cast(Iterable[Dict[str, Any]], template.get("items", []) or [])
                for item_order, item in enumerate(items):
                    defaults = {
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

                    if context_item_has_chapter_field:
                        if item.get("type") == "chapter":
                            defaults["chapter"] = ChapterModel.objects.filter(
                                id=item.get("id")
                            ).first()
                        else:
                            defaults["chapter"] = None

                    LibraryContextItemModel.objects.update_or_create(
                        section=section_obj,
                        item_id=item.get("id", f"{slug}-{item_order}"),
                        defaults=defaults,
                    )
