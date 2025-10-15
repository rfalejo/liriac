from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Iterable, List, Optional, cast
from uuid import uuid4

from django.db import transaction
from django.db.models import Max, Q

from ..models import (
    Book,
    Chapter,
    ChapterContextVisibility,
    ContextItemType,
    LibraryContextItem,
    LibrarySection,
)
from ..payloads import ContextItemPayload, ContextSectionPayload
from ..sample_data import SAMPLE_LIBRARY_BOOKS, SAMPLE_LIBRARY_SECTIONS

__all__ = [
    "get_section_templates_for_book",
    "ensure_book_context_sections",
    "get_book_context_sections",
    "create_book_context_item",
    "delete_book_context_item",
    "get_active_context_items",
    "update_book_context_items",
    "update_chapter_context_visibility",
]


def get_section_templates_for_book(book_id: str) -> List[Dict[str, Any]]:
    template_source = deepcopy(SAMPLE_LIBRARY_SECTIONS)
    sample_book_ids = {book.get("id") for book in SAMPLE_LIBRARY_BOOKS}

    if book_id in sample_book_ids:
        return cast(List[Dict[str, Any]], template_source)

    templates: List[Dict[str, Any]] = []
    for section in template_source:
        templates.append(
            {
                "id": section.get("id"),
                "slug": section.get("slug") or section.get("id"),
                "title": section.get("title"),
                "defaultOpen": section.get("defaultOpen", False),
                "items": [],
            }
        )
    return templates


def ensure_book_context_sections(book: Book) -> List[LibrarySection]:
    sections = list(
        LibrarySection.objects.prefetch_related("items")
        .filter(book=book)
        .order_by("order", "slug", "id")
    )
    if sections:
        return sections

    templates = get_section_templates_for_book(book.id)
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

        for item_order, raw_item in enumerate(
            cast(Iterable[Dict[str, Any]], template.get("items", []))
        ):
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


def _coerce_optional_text(value: Optional[str]) -> str:
    if value in {None, ""}:
        return ""
    return str(value)


def _visibility_key(section_slug: str, item_id: str) -> str:
    return f"{section_slug}::{item_id}"


def get_book_context_sections(
    book_id: str,
    *,
    chapter_id: Optional[str] = None,
) -> List[ContextSectionPayload]:
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return []

    sections = ensure_book_context_sections(book)

    chapter_specific_items: Dict[str, List[ContextItemPayload]] = {}
    visibility_overrides: Dict[str, bool] = {}
    if chapter_id:
        chapter_specific_items = {}
        for item in LibraryContextItem.objects.filter(
            section__book=book,
            chapter_id=chapter_id,
        ).order_by("section__order", "order"):
            chapter_specific_items.setdefault(item.section.slug, []).append(item.to_payload())

        visibility_overrides = {
            _visibility_key(
                entry.context_item.section.slug, entry.context_item.item_id
            ): entry.visible
            for entry in ChapterContextVisibility.objects.filter(
                chapter_id=chapter_id,
                context_item__section__book=book,
            ).select_related("context_item__section")
        }

    payloads: List[ContextSectionPayload] = []
    for section in sections:
        base_items = [item.to_payload() for item in section.items.all() if item.chapter_id is None]

        if chapter_id:
            extra_items = chapter_specific_items.get(section.slug, [])
            items: List[ContextItemPayload] = []
            for item in base_items:
                key = _visibility_key(section.slug, item["id"])
                default_visible = bool(item.get("checked", False))
                item["visibleForChapter"] = visibility_overrides.get(key, default_visible)
                items.append(item)
            items.extend(extra_items)
        else:
            items = base_items

        payload = dict(section.to_payload())
        payload["items"] = items
        payloads.append(cast(ContextSectionPayload, payload))

    return payloads


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

        ensure_book_context_sections(book)

        try:
            section = LibrarySection.objects.select_for_update().get(book=book, slug=section_slug)
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


def delete_book_context_item(
    book_id: str,
    *,
    section_slug: str,
    item_id: str,
    chapter_id: Optional[str] = None,
) -> List[ContextSectionPayload]:
    with transaction.atomic():
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

        item.delete()

    return get_book_context_sections(book_id)


def get_active_context_items(
    *,
    book_id: str,
    chapter_id: Optional[str] = None,
) -> List[ContextItemPayload]:
    filters = Q(section__book_id=book_id, disabled=False)
    if chapter_id:
        filters &= Q(Q(chapter__isnull=True) | Q(chapter_id=chapter_id))
    else:
        filters &= Q(chapter__isnull=True, checked=True)

    visibility_overrides: Dict[str, bool] = {}
    if chapter_id:
        visibility_overrides = {
            entry.context_item_id: entry.visible
            for entry in ChapterContextVisibility.objects.filter(
                chapter_id=chapter_id,
                context_item__section__book_id=book_id,
            )
        }

    active_items: List[ContextItemPayload] = []
    for item in LibraryContextItem.objects.filter(filters).order_by("section__order", "order"):
        default_visible = bool(item.checked)
        if chapter_id and item.chapter_id is None:
            visible = visibility_overrides.get(item.id, default_visible)
            if not visible:
                continue
        elif not chapter_id and not default_visible:
            continue

        active_items.append(item.to_payload())

    return active_items


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


def update_chapter_context_visibility(
    chapter_id: str,
    updates: List[Dict[str, Any]],
) -> List[ContextSectionPayload]:
    with transaction.atomic():
        try:
            chapter = Chapter.objects.select_for_update().select_related("book").get(pk=chapter_id)
        except Chapter.DoesNotExist as exc:
            raise KeyError(f"Unknown chapter: {chapter_id}") from exc

        book = chapter.book

        if updates:
            for update in updates:
                section_slug = str(update["sectionSlug"])
                item_id = str(update["id"])
                visible = bool(update["visible"])

                try:
                    context_item = (
                        LibraryContextItem.objects.select_for_update()
                        .select_related("section")
                        .get(
                            section__book=book,
                            section__slug=section_slug,
                            item_id=item_id,
                            chapter__isnull=True,
                        )
                    )
                except LibraryContextItem.DoesNotExist as exc:
                    raise KeyError(
                        f"Unknown book-scoped context item: {section_slug}:{item_id}"
                    ) from exc

                default_visible = bool(context_item.checked)

                if visible == default_visible:
                    ChapterContextVisibility.objects.filter(
                        chapter=chapter,
                        context_item=context_item,
                    ).delete()
                else:
                    ChapterContextVisibility.objects.update_or_create(
                        chapter=chapter,
                        context_item=context_item,
                        defaults={"visible": visible},
                    )

        return get_book_context_sections(book.id, chapter_id=chapter_id)
