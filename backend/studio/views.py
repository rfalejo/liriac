from __future__ import annotations

from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from django.http import Http404

from .data import CHAPTER_DETAILS, EDITOR_STATE, LIBRARY_BOOKS, LIBRARY_SECTIONS
from .serializers import (
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
        chapter = CHAPTER_DETAILS.get(chapter_id)
        if chapter is None:
            raise Http404("Chapter not found")
        serializer = ChapterDetailSerializer(chapter)
        return Response(serializer.data)


class EditorView(APIView):
    """Return the current editor snapshot."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=EditorStateSerializer)
    def get(self, _request):
        serializer = EditorStateSerializer(EDITOR_STATE)
        return Response(serializer.data)
