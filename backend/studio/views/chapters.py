from __future__ import annotations

from django.http import Http404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ..data import (
    create_chapter_block,
    delete_chapter_block,
    get_chapter_detail,
    update_chapter,
    update_chapter_block,
)
from ..serializers import (
    ChapterBlockCreateSerializer,
    ChapterBlockUpdateSerializer,
    ChapterDetailSerializer,
    ChapterSummarySerializer,
    ChapterUpsertSerializer,
)
from .utils import flatten_structured_block_fields

__all__ = [
    "ChapterDetailView",
    "ChapterBlockListView",
    "ChapterBlockUpdateView",
]


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

        payload = flatten_structured_block_fields(
            payload,
            block_type=existing_block.get("type"),
            block_kind=existing_block.get("kind"),
        )

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

    @extend_schema(responses=ChapterDetailSerializer)
    def delete(self, _request, chapter_id: str, block_id: str):
        try:
            updated_chapter = delete_chapter_block(chapter_id, block_id)
        except KeyError as exc:
            raise Http404(str(exc)) from exc

        response_serializer = ChapterDetailSerializer(updated_chapter)
        return Response(response_serializer.data)


class ChapterBlockListView(APIView):
    """Create blocks within a chapter."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=ChapterBlockCreateSerializer,
        responses=ChapterDetailSerializer,
    )
    def post(self, request, chapter_id: str):
        serializer = ChapterBlockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        payload = flatten_structured_block_fields(
            payload,
            block_type=payload.get("type"),
            block_kind=payload.get("kind"),
        )

        try:
            updated_chapter = create_chapter_block(chapter_id, payload)
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        response_serializer = ChapterDetailSerializer(updated_chapter)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
