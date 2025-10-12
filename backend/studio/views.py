from __future__ import annotations

from django.http import Http404
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .data import (
    EDITOR_STATE,
    LIBRARY_BOOKS,
    LIBRARY_SECTIONS,
    get_chapter_detail,
    update_chapter_block,
)
from .serializers import (
    ChapterBlockUpdateSerializer,
    ChapterDetailSerializer,
    EditorStateSerializer,
    LibraryBooksResponseSerializer,
    LibraryResponseSerializer,
)


class LibraryView(APIView):
    """Return the available context sections for the local library."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=LibraryResponseSerializer)
    def get(self, _request):
        serializer = LibraryResponseSerializer({"sections": LIBRARY_SECTIONS})
        return Response(serializer.data)


class LibraryBooksView(APIView):
    """Return the list of books and chapter summaries."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=LibraryBooksResponseSerializer)
    def get(self, _request):
        serializer = LibraryBooksResponseSerializer({"books": LIBRARY_BOOKS})
        return Response(serializer.data)


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

        response_serializer = ChapterDetailSerializer(updated_chapter)
        return Response(response_serializer.data)


class EditorView(APIView):
    """Return the current editor snapshot."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=EditorStateSerializer)
    def get(self, _request):
        serializer = EditorStateSerializer(EDITOR_STATE)
        return Response(serializer.data)
