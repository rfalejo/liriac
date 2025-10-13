from __future__ import annotations

from django.http import Http404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ..data import (
    create_book,
    create_book_context_item,
    create_chapter,
    delete_book,
    get_book_context_sections,
    get_library_books,
    update_book,
    update_book_context_items,
)
from ..models import Book
from ..serializers import (
    BookUpsertSerializer,
    ChapterSummarySerializer,
    ChapterUpsertSerializer,
    ContextItemCreateSerializer,
    ContextItemsUpdateRequestSerializer,
    LibraryBookSerializer,
    LibraryBooksResponseSerializer,
    LibraryResponseSerializer,
)

__all__ = [
    "LibraryBookContextView",
    "LibraryBooksView",
    "LibraryBookDetailView",
    "LibraryBookContextItemsView",
    "LibraryBookChaptersView",
]


class LibraryBookContextView(APIView):
    """Return the context sections scoped to a specific book (optionally a chapter)."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=LibraryResponseSerializer)
    def get(self, request, book_id: str):
        chapter_id = request.query_params.get("chapterId")

        sections = get_book_context_sections(book_id, chapter_id=chapter_id)
        if not sections and not Book.objects.filter(pk=book_id).exists():
            raise Http404("Book not found")

        serializer = LibraryResponseSerializer({"sections": sections})
        return Response(serializer.data)


class LibraryBooksView(APIView):
    """Return the list of books and chapter summaries."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=LibraryBooksResponseSerializer)
    def get(self, _request):
        books = get_library_books()
        serializer = LibraryBooksResponseSerializer({"books": books})
        return Response(serializer.data)

    @extend_schema(request=BookUpsertSerializer, responses=LibraryBookSerializer)
    def post(self, request):
        serializer = BookUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        book_id = payload.get("id")
        try:
            book = create_book(
                book_id=book_id,
                title=payload["title"],
                author=payload.get("author"),
                synopsis=payload.get("synopsis"),
                order=payload.get("order"),
            )
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        response_serializer = LibraryBookSerializer(book)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class LibraryBookDetailView(APIView):
    """Update metadata for a single book."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(request=BookUpsertSerializer, responses=LibraryBookSerializer)
    def patch(self, request, book_id: str):
        serializer = BookUpsertSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if "id" in payload and payload["id"] != book_id:
            raise ValidationError({"id": "El identificador del libro no coincide con la ruta."})

        try:
            book = update_book(
                book_id,
                {
                    key: value
                    for key, value in payload.items()
                    if key in {"title", "author", "synopsis", "order"}
                },
            )
        except KeyError as exc:
            raise Http404(str(exc)) from exc

        response_serializer = LibraryBookSerializer(book)
        return Response(response_serializer.data)

    @extend_schema(responses={204: None})
    def delete(self, _request, book_id: str):
        try:
            delete_book(book_id)
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryBookChaptersView(APIView):
    """Manage chapters belonging to a single book."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(request=ChapterUpsertSerializer, responses=ChapterSummarySerializer)
    def post(self, request, book_id: str):
        serializer = ChapterUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            chapter = create_chapter(
                book_id=book_id,
                chapter_id=payload.get("id"),
                title=payload["title"],
                summary=payload.get("summary"),
                ordinal=payload.get("ordinal"),
                tokens=payload.get("tokens"),
                word_count=payload.get("wordCount"),
            )
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        response_serializer = ChapterSummarySerializer(chapter)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class LibraryBookContextItemsView(APIView):
    """Update editable fields for context items belonging to a book."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=ContextItemCreateSerializer,
        responses={201: LibraryResponseSerializer},
    )
    def post(self, request, book_id: str):
        serializer = ContextItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            sections = create_book_context_item(book_id, payload)
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        response_serializer = LibraryResponseSerializer({"sections": sections})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        request=ContextItemsUpdateRequestSerializer,
        responses=LibraryResponseSerializer,
    )
    def patch(self, request, book_id: str):
        serializer = ContextItemsUpdateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data["items"]

        if not Book.objects.filter(pk=book_id).exists():
            raise Http404("Book not found")

        try:
            sections = update_book_context_items(book_id, updates)
        except KeyError as exc:
            raise Http404(str(exc)) from exc

        response_serializer = LibraryResponseSerializer({"sections": sections})
        return Response(response_serializer.data)
