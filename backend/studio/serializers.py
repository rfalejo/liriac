from __future__ import annotations

from rest_framework import serializers


class DialogueTurnSerializer(serializers.Serializer):
    speakerId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    speakerName = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    utterance = serializers.CharField()
    stageDirection = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tone = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class ChapterBlockSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.ChoiceField(
        choices=("paragraph", "dialogue", "scene_boundary", "metadata"),
    )
    position = serializers.IntegerField()
    text = serializers.CharField(required=False, allow_blank=True)
    style = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )
    turns = DialogueTurnSerializer(many=True, required=False)
    context = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    label = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    summary = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    locationId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    locationName = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    timestamp = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    mood = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    kind = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    subtitle = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ordinal = serializers.IntegerField(required=False, allow_null=True)
    epigraph = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    epigraphAttribution = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    povCharacterId = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    povCharacterName = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    timelineMarker = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    themeTags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )
    status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    owner = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    lastUpdated = serializers.CharField(required=False, allow_blank=True, allow_null=True)


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
    paragraphs = serializers.ListField(child=serializers.CharField())
    blocks = ChapterBlockSerializer(many=True)
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
    paragraphs = serializers.ListField(child=serializers.CharField())
    blocks = ChapterBlockSerializer(many=True)
    bookId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bookTitle = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
