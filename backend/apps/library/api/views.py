from __future__ import annotations

import logging
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics, mixins, status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.autosave.services.autosave import AutosaveService

from ..models import Book, Chapter, Persona
from .serializers import (
    AutosaveSerializer,
    BookSerializer,
    ChapterCreateSerializer,
    ChapterDetailSerializer,
    ChapterListSerializer,
    ChaptersReorderSerializer,
    PersonaSerializer,
)


class BookViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet[Book],
):
    queryset = Book.objects.all().order_by("title")
    serializer_class = BookSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "slug"]
    ordering_fields = ["title", "created_at"]


class ChapterViewSet(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet[Chapter]):
    queryset = Chapter.objects.select_related("book").all()
    serializer_class = ChapterDetailSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title"]
    ordering_fields = ["order", "updated_at"]

    def get_serializer_class(self) -> Any:  # noqa: D401
        return ChapterDetailSerializer


class BookChapterListCreateAPIView(generics.GenericAPIView[Chapter]):
    filter_backends = [SearchFilter, OrderingFilter]

    def get_serializer_class(self) -> Any:  # noqa: D401
        if self.request.method == 'POST':
            return ChapterCreateSerializer
        return ChapterListSerializer

    @extend_schema(
        operation_id="books_chapters_list",
        responses={200: ChapterListSerializer(many=True)},
        tags=["books"],
    )
    def get(self, request: Request, book_pk: int, *args: Any, **kwargs: Any) -> Response:  # noqa: D401
        qs = Chapter.objects.filter(book_id=book_pk).order_by("order")
        paginator = viewsets.GenericViewSet().paginator
        if paginator is not None:  # pragma: no branch - simple guard
            page = paginator.paginate_queryset(qs, request)
            serializer = ChapterListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = ChapterListSerializer(qs, many=True)
        return Response(serializer.data)

    @extend_schema(
        operation_id="books_chapters_create",
        request=ChapterCreateSerializer,
        responses={201: ChapterListSerializer},
        tags=["books"],
    )
    def post(self, request: Request, book_pk: int, *args: Any, **kwargs: Any) -> Response:  # noqa: D401
        book = get_object_or_404(Book, pk=book_pk)
        serializer = ChapterCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Compute next order atomically; ignore any client-sent 'order' if present
        with transaction.atomic():
            last = (
                Chapter.objects.select_for_update()
                .filter(book=book)
                .order_by("-order")
                .first()
            )
            next_order = (last.order if last else 0) + 1
            payload = dict(serializer.validated_data)
            payload.setdefault("body", "")
            chapter = Chapter.objects.create(book=book, order=next_order, **payload)
        out = ChapterListSerializer(instance=chapter).data
        return Response(out, status=status.HTTP_201_CREATED)


class PersonaViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet[Persona],
):
    queryset = Persona.objects.all().order_by("name")
    serializer_class = PersonaSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "role"]
    ordering_fields = ["name"]


@extend_schema(
    request=AutosaveSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "saved": {"type": "boolean"},
                "checksum": {"type": "string"},
                "saved_at": {"type": "string", "format": "date-time"},
            },
            "required": ["saved", "checksum", "saved_at"],
        },
        400: {"description": "Bad request"},
        404: {"description": "Chapter not found"},
    },
)
class ChapterAutosaveAPIView(APIView):
    """POST /api/v1/chapters/<id>/autosave/"""

    def post(self, request: Request, id: int, *args: Any, **kwargs: Any) -> Response:  # noqa: D401
        chapter = get_object_or_404(Chapter, pk=id)
        serializer = AutosaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            result = AutosaveService.autosave(
                chapter_id=int(chapter.pk),
                body=data["body"],
                checksum=data["checksum"],
            )
        except ValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"saved": result.saved, "checksum": result.checksum, "saved_at": result.saved_at},
            status=status.HTTP_200_OK,
        )


class BookChaptersReorderAPIView(APIView):
    """POST /api/v1/books/<book_pk>/chapters/reorder/

    Payload: { "ordered_ids": [ ... all chapter IDs for this book ... ] }
    """

    logger = logging.getLogger(__name__)

    @extend_schema(
        operation_id="books_chapters_reorder",
        request=ChaptersReorderSerializer,
        responses={200: ChapterListSerializer(many=True)},
        tags=["books"],
    )
    def post(self, request: Request, book_pk: int, *args: Any, **kwargs: Any) -> Response:
        get_object_or_404(Book, pk=book_pk)  # ensure book exists
        serializer = ChaptersReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ordered_ids = serializer.validated_data["ordered_ids"]

        # Fetch actual ids for the book
        qs = Chapter.objects.filter(book_id=book_pk).order_by("order")
        current_ids = list(qs.values_list("id", flat=True))
        # Validation: must match set exactly and lengths equal
        if len(ordered_ids) != len(current_ids):
            return Response(
                {"ordered_ids": ["Payload must include all chapters for this book."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if set(ordered_ids) != set(current_ids):
            return Response(
                {"ordered_ids": ["IDs must match chapters of the specified book exactly."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Renumber atomically with row locking to avoid races
        with transaction.atomic():
            # Lock rows and shift orders by +N to avoid unique collisions during renumbering
            chapters_qs = Chapter.objects.select_for_update().filter(
                id__in=ordered_ids, book_id=book_pk
            )
            chapters = list(chapters_qs)
            n = len(chapters)
            chapters_qs.update(order=F("order") + n)
            # Refresh objects with shifted orders (not strictly needed for next step)
            by_id = {int(c.pk): c for c in chapters}
            # Assign final sequential orders 1..N following provided ordered_ids
            for idx, ch_id in enumerate(ordered_ids, start=1):
                ch = by_id[ch_id]
                ch.order = idx
            Chapter.objects.bulk_update(chapters, ["order"])

        updated = Chapter.objects.filter(book_id=book_pk).order_by("order")
        self.logger.info(
            "chapters_reordered",
            extra={"book_id": book_pk, "count": len(ordered_ids)},
        )
        return Response(ChapterListSerializer(updated, many=True).data, status=status.HTTP_200_OK)
