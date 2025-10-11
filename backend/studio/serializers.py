from __future__ import annotations

from rest_framework import serializers


class ContextItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.ChoiceField(
        choices=("character", "world", "styleTone", "chapter"),
    )
    name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, allow_blank=True)
    summary = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    facts = serializers.CharField(required=False, allow_blank=True)
    tokens = serializers.IntegerField(required=False)
    checked = serializers.BooleanField(required=False)
    disabled = serializers.BooleanField(required=False)


class ContextSectionSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    defaultOpen = serializers.BooleanField(required=False)
    items = ContextItemSerializer(many=True)


class LibraryResponseSerializer(serializers.Serializer):
    sections = ContextSectionSerializer(many=True)


class EditorStateSerializer(serializers.Serializer):
    content = serializers.CharField()
    tokens = serializers.IntegerField()
    cursor = serializers.IntegerField(required=False, allow_null=True)
    bookId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bookTitle = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    chapterId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    chapterTitle = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class ChapterSummarySerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    summary = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ordinal = serializers.IntegerField()
    tokens = serializers.IntegerField(required=False, allow_null=True)
    wordCount = serializers.IntegerField(required=False, allow_null=True)


class LibraryBookSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    author = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    synopsis = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    chapters = ChapterSummarySerializer(many=True)


class LibraryBooksResponseSerializer(serializers.Serializer):
    books = LibraryBookSerializer(many=True)


class ChapterDetailSerializer(ChapterSummarySerializer):
    content = serializers.CharField()
    bookId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bookTitle = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
