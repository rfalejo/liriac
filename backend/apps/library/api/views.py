from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
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
    PersonaSerializer,
)


class BookViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet[Book]):
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


class BookChapterListCreateAPIView(generics.GenericAPIView):
    filter_backends = [SearchFilter, OrderingFilter]

    def get_serializer_class(self) -> Any:  # noqa: D401
        if self.request.method == 'POST':
            return ChapterCreateSerializer
        return ChapterListSerializer

    def get(self, request: Request, book_pk: int, *args: Any, **kwargs: Any) -> Response:  # noqa: D401
        qs = Chapter.objects.filter(book_id=book_pk).order_by("order")
        # Manual pagination using DRF paginator
        paginator = viewsets.GenericViewSet().paginator
        # Fallback if paginator not configured
        if paginator is not None:  # pragma: no branch - simple guard
            page = paginator.paginate_queryset(qs, request)
            serializer = ChapterListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = ChapterListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request: Request, book_pk: int, *args: Any, **kwargs: Any) -> Response:  # noqa: D401
        book = get_object_or_404(Book, pk=book_pk)
        serializer = ChapterCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chapter = Chapter.objects.create(book=book, **serializer.validated_data)
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
                chapter_id=chapter.id,
                body=data["body"],
                checksum=data["checksum"],
            )
        except ValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"saved": result.saved, "checksum": result.checksum, "saved_at": result.saved_at},
            status=status.HTTP_200_OK,
        )
