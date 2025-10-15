from __future__ import annotations

from typing import Any, Dict, Iterable, cast

from django.db import transaction

from ..models import (
    Book,
    Chapter,
    ChapterBlock,
    ChapterBlockVersion,
    LibraryContextItem,
    LibrarySection,
)
from ..sample_data import (
    DEFAULT_EDITOR_CHAPTER_ID,
    SAMPLE_CHAPTER_BLOCKS,
    SAMPLE_CHAPTER_METADATA,
    SAMPLE_LIBRARY_BOOKS,
    SAMPLE_LIBRARY_SECTIONS,
)
from .context import get_section_templates_for_book

__all__ = ["bootstrap_sample_data"]


def bootstrap_sample_data(*, force: bool = False, apps=None) -> None:
    BookModel = Book if apps is None else apps.get_model("studio", "Book")
    ChapterModel = Chapter if apps is None else apps.get_model("studio", "Chapter")
    ChapterBlockModel = ChapterBlock if apps is None else apps.get_model("studio", "ChapterBlock")
    try:
        ChapterBlockVersionModel = (
            ChapterBlockVersion if apps is None else apps.get_model("studio", "ChapterBlockVersion")
        )
    except LookupError:
        ChapterBlockVersionModel = None
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
    block_field_names = {field.name for field in ChapterBlockModel._meta.fields}
    block_supports_version_metadata = {
        "version_count",
        "active_version_number",
        "active_version",
    }.issubset(block_field_names)

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
                    defaults = {
                        "chapter": chapter_obj,
                        "type": block.get("type", "paragraph"),
                        "position": int(block.get("position", 0)),
                        "payload": payload,
                    }
                    if block_supports_version_metadata:
                        defaults.update(
                            {
                                "version_count": 1,
                                "active_version_number": 1,
                            }
                        )

                    block_obj, _ = ChapterBlockModel.objects.update_or_create(
                        id=block["id"],
                        defaults=defaults,
                    )

                    if block_supports_version_metadata and ChapterBlockVersionModel is not None:
                        version_obj, _ = ChapterBlockVersionModel.objects.update_or_create(
                            block=block_obj,
                            version=1,
                            defaults={
                                "payload": payload,
                                "is_active": True,
                            },
                        )
                        # Historical models prior to migration 0006 lack these fields.
                        updated_fields: list[str] = []
                        if hasattr(block_obj, "active_version"):
                            block_obj.active_version = version_obj
                            updated_fields.append("active_version")
                        if hasattr(block_obj, "active_version_number"):
                            block_obj.active_version_number = int(version_obj.version)
                            updated_fields.append("active_version_number")
                        if hasattr(block_obj, "version_count"):
                            related_manager = getattr(block_obj, "versions", None)
                            count = related_manager.count() if related_manager else 1
                            block_obj.version_count = max(count, 1)
                            updated_fields.append("version_count")
                        if hasattr(block_obj, "updated_at"):
                            updated_fields.append("updated_at")
                        if updated_fields:
                            block_obj.save(update_fields=updated_fields)

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
                    defaults = {
                        "chapter": chapter_obj,
                        "type": block.get("type", "paragraph"),
                        "position": int(block.get("position", 0)),
                        "payload": payload,
                    }
                    if block_supports_version_metadata:
                        defaults.update(
                            {
                                "version_count": 1,
                                "active_version_number": 1,
                            }
                        )

                    block_obj, _ = ChapterBlockModel.objects.update_or_create(
                        id=block["id"],
                        defaults=defaults,
                    )

                    if block_supports_version_metadata and ChapterBlockVersionModel is not None:
                        version_obj, _ = ChapterBlockVersionModel.objects.update_or_create(
                            block=block_obj,
                            version=1,
                            defaults={
                                "payload": payload,
                                "is_active": True,
                            },
                        )
                        updated_fields: list[str] = []
                        if hasattr(block_obj, "active_version"):
                            block_obj.active_version = version_obj
                            updated_fields.append("active_version")
                        if hasattr(block_obj, "active_version_number"):
                            block_obj.active_version_number = int(version_obj.version)
                            updated_fields.append("active_version_number")
                        if hasattr(block_obj, "version_count"):
                            related_manager = getattr(block_obj, "versions", None)
                            count = related_manager.count() if related_manager else 1
                            block_obj.version_count = max(count, 1)
                            updated_fields.append("version_count")
                        if hasattr(block_obj, "updated_at"):
                            updated_fields.append("updated_at")
                        if updated_fields:
                            block_obj.save(update_fields=updated_fields)

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
            templates = get_section_templates_for_book(book_obj.id)
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
