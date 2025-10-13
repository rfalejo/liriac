from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List, Optional
from uuid import uuid4

from django.db import IntegrityError, transaction
from django.db.models import Max

from ..models import Book
from ..payloads import LibraryBookPayload
from ..sample_data import SAMPLE_LIBRARY_BOOKS
from .context import ensure_book_context_sections

__all__ = [
    "get_library_books",
    "get_book_metadata",
    "create_book",
    "update_book",
    "delete_book",
]


def get_library_books() -> List[LibraryBookPayload]:
    books = Book.objects.prefetch_related("chapters").order_by("order", "title")
    if not books:
        return deepcopy(SAMPLE_LIBRARY_BOOKS)  # type: ignore[return-value]
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


def _next_book_order() -> int:
    current_max = Book.objects.aggregate(Max("order")).get("order__max")
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

        ensure_book_context_sections(book)
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
