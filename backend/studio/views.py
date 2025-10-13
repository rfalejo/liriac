from __future__ import annotations

from django.http import Http404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .data import (
    create_book,
    create_chapter,
    delete_book,
    get_chapter_detail,
    get_editor_state,
    get_library_books,
    get_library_sections,
    update_context_items,
    update_book,
    update_chapter,
    update_chapter_block,
)
from .serializers import (
    BookUpsertSerializer,
    ChapterBlockUpdateSerializer,
    ChapterDetailSerializer,
    ChapterSummarySerializer,
    ChapterUpsertSerializer,
    ContextItemsUpdateRequestSerializer,
    EditorStateSerializer,
    LibraryBookSerializer,
    LibraryBooksResponseSerializer,
    LibraryResponseSerializer,
)


class LibraryView(APIView):
    """Return the available context sections for the local library."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=LibraryResponseSerializer)
    def get(self, _request):
        sections = get_library_sections()
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


class LibraryContextItemsView(APIView):
    """Update editable fields for context items."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=ContextItemsUpdateRequestSerializer,
        responses=LibraryResponseSerializer,
    )
    def patch(self, request):
        serializer = ContextItemsUpdateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data["items"]

        try:
            sections = update_context_items(updates)
        except KeyError as exc:
            raise Http404(str(exc)) from exc

        response_serializer = LibraryResponseSerializer({"sections": sections})
        return Response(response_serializer.data)


class ChapterDetailView(APIView):
    """Return the full content for a single chapter."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=ChapterDetailSerializer)
    def get(self, _request, chapter_id: str):
        chapter = get_chapter_detail(chapter_id)
        if chapter is None:
            raise Http404("Chapter not found")
        serializer = ChapterDetailSerializer(chapter)
        return Response(serializer.data)

    @extend_schema(request=ChapterUpsertSerializer, responses=ChapterSummarySerializer)
    def patch(self, request, chapter_id: str):
        serializer = ChapterUpsertSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if "id" in payload and payload["id"] != chapter_id:
            raise ValidationError({"id": "El identificador del capítulo no coincide con la ruta."})

        updates = {}
        if "title" in payload:
            updates["title"] = payload["title"]
        if "summary" in payload:
            updates["summary"] = payload["summary"]
        if "ordinal" in payload:
            updates["ordinal"] = payload["ordinal"]
        if "tokens" in payload:
            updates["tokens"] = payload["tokens"]
        if "wordCount" in payload:
            updates["word_count"] = payload["wordCount"]

        try:
            chapter = update_chapter(chapter_id, updates)
        except KeyError as exc:
            raise Http404(str(exc)) from exc

        response_serializer = ChapterSummarySerializer(chapter)
        return Response(response_serializer.data)


class ChapterBlockUpdateView(APIView):
    """Update a single block within a chapter."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=ChapterBlockUpdateSerializer,
        responses=ChapterDetailSerializer,
    )
    def patch(self, request, chapter_id: str, block_id: str):
        chapter = get_chapter_detail(chapter_id)
        if chapter is None:
            raise Http404("Chapter not found")

        try:
            existing_block = next(block for block in chapter["blocks"] if block["id"] == block_id)
        except StopIteration as exc:
            raise Http404("Block not found") from exc

        serializer = ChapterBlockUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if not payload:
            raise ValidationError("No se enviaron cambios para actualizar.")

        if "id" in payload and payload["id"] != block_id:
            raise ValidationError({"id": "El identificador del bloque no coincide con la ruta."})

        if "type" in payload and payload["type"] != existing_block["type"]:
            raise ValidationError(
                {"type": "El tipo de bloque no puede cambiarse en esta operación."}
            )

        try:
            updated_chapter = update_chapter_block(chapter_id, block_id, payload)
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        except ValueError as exc:
            raise ValidationError({"type": str(exc)}) from exc

        response_serializer = ChapterDetailSerializer(updated_chapter)
        return Response(response_serializer.data)


class EditorView(APIView):
    """Return the current editor snapshot."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=EditorStateSerializer)
    def get(self, _request):
        editor_state = get_editor_state()
        serializer = EditorStateSerializer(editor_state)
        return Response(serializer.data)
