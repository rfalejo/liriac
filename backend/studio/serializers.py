from __future__ import annotations

from typing import Any, Dict

from rest_framework import serializers


class BookUpsertSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    title = serializers.CharField()
    author = serializers.CharField(required=False, allow_blank=True)
    synopsis = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=False, min_value=0)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.partial:
            self.fields["title"].required = False


class DialogueTurnSerializer(serializers.Serializer):
    id = serializers.CharField()
    speakerId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    speakerName = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    utterance = serializers.CharField()
    stageDirection = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tone = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class NarrativeContextSerializer(serializers.Serializer):
    povCharacterId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    povCharacterName = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    timelineMarker = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    locationId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    locationName = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    themeTags = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        required=False,
        allow_empty=True,
        allow_null=True,
    )


class SceneDetailsSerializer(serializers.Serializer):
    locationId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    locationName = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    timestamp = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    mood = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class ChapterBlockSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.ChoiceField(
        choices=("paragraph", "dialogue", "scene_boundary", "metadata"),
    )
    position = serializers.IntegerField()
    version = serializers.IntegerField(required=False, min_value=1, max_value=999, write_only=True)
    activeVersion = serializers.IntegerField(required=False, read_only=True)
    versionCount = serializers.IntegerField(required=False, read_only=True)
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
        child=serializers.CharField(allow_blank=True),
        required=False,
        allow_empty=True,
    )
    status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    owner = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    lastUpdated = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    narrativeContext = NarrativeContextSerializer(required=False, allow_null=True)
    sceneDetails = SceneDetailsSerializer(required=False, allow_null=True)

    def to_representation(self, instance: Any) -> Dict[str, Any]:
        data = super().to_representation(instance)

        if not isinstance(instance, dict):
            return data

        block_type = instance.get("type")

        if block_type == "metadata":
            kind = instance.get("kind")
            context_field_names = [
                "povCharacterId",
                "povCharacterName",
                "timelineMarker",
                "locationId",
                "locationName",
            ]
            context_payload: Dict[str, Any] = {
                field: instance.get(field) for field in context_field_names
            }
            theme_tags = instance.get("themeTags")
            if theme_tags is None:
                theme_tags = data.get("themeTags")
            if theme_tags is None or not isinstance(theme_tags, list):
                theme_tags = []
            context_payload["themeTags"] = theme_tags

            if (
                kind == "context"
                or any(context_payload[field] not in (None, "") for field in context_field_names)
                or bool(theme_tags)
            ):
                data["narrativeContext"] = context_payload

        if block_type == "scene_boundary":
            scene_detail_keys = ("locationId", "locationName", "timestamp", "mood")
            if any(instance.get(key) not in (None, "") for key in scene_detail_keys):
                data["sceneDetails"] = {key: instance.get(key) for key in scene_detail_keys}

        return data


class ChapterBlockUpdateSerializer(ChapterBlockSerializer):
    class Meta:
        ref_name = "ChapterBlockUpdate"

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("partial", True)
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.required = False


class ChapterBlockCreateSerializer(ChapterBlockSerializer):
    class Meta:
        ref_name = "ChapterBlockCreate"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["id"].required = False
        self.fields["position"].required = False


class ChapterBlockVersionSerializer(serializers.Serializer):
    version = serializers.IntegerField()
    isActive = serializers.BooleanField()
    payload = serializers.JSONField()


class ChapterBlockVersionListSerializer(serializers.Serializer):
    versions = ChapterBlockVersionSerializer(many=True)


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
    chapterId = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    visibleForChapter = serializers.BooleanField(required=False)


class ContextSectionSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    defaultOpen = serializers.BooleanField(required=False)
    items = ContextItemSerializer(many=True)


class LibraryResponseSerializer(serializers.Serializer):
    sections = ContextSectionSerializer(many=True)


class ContextItemUpdateSerializer(serializers.Serializer):
    id = serializers.CharField()
    sectionSlug = serializers.CharField()
    chapterId = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    role = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    summary = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    facts = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class ContextItemsUpdateRequestSerializer(serializers.Serializer):
    items = ContextItemUpdateSerializer(many=True)


class ContextItemCreateSerializer(serializers.Serializer):
    sectionSlug = serializers.CharField()
    type = serializers.ChoiceField(
        choices=("character", "world", "styleTone", "chapter"),
    )
    id = serializers.CharField(required=False, allow_blank=True)
    chapterId = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    role = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    summary = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    facts = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tokens = serializers.IntegerField(required=False, allow_null=True)
    checked = serializers.BooleanField(required=False)
    disabled = serializers.BooleanField(required=False)


class ChapterContextVisibilityUpdateItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    sectionSlug = serializers.CharField()
    visible = serializers.BooleanField()


class ChapterContextVisibilityUpdateRequestSerializer(serializers.Serializer):
    items = ChapterContextVisibilityUpdateItemSerializer(many=True)


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


class ChapterUpsertSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    title = serializers.CharField()
    summary = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ordinal = serializers.IntegerField(required=False, min_value=0)
    tokens = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    wordCount = serializers.IntegerField(required=False, allow_null=True, min_value=0)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.partial:
            self.fields["title"].required = False


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


class ParagraphSuggestionRequestSerializer(serializers.Serializer):
    blockId = serializers.CharField(required=False, allow_blank=True)
    instructions = serializers.CharField(required=False, allow_blank=True)


class ParagraphSuggestionResponseSerializer(serializers.Serializer):
    paragraphSuggestion = serializers.CharField()


class ParagraphSuggestionPromptResponseSerializer(serializers.Serializer):
    prompt = serializers.CharField()


class GeneralSuggestionRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField()
    placement = serializers.ChoiceField(choices=("before", "after", "append"))
    anchorBlockId = serializers.CharField(required=False, allow_blank=True)
    model = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:  # type: ignore[override]
        placement = attrs.get("placement")
        anchor = attrs.get("anchorBlockId")

        if placement in {"before", "after"} and not anchor:
            raise serializers.ValidationError(
                {"anchorBlockId": "Debes proporcionar un bloque de anclaje para esta ubicación."}
            )

        return attrs


class BlockConversionTurnSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, allow_blank=True)
    speakerId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    speakerName = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    utterance = serializers.CharField()
    stageDirection = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class BlockConversionBlockSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=("paragraph", "dialogue"))
    text = serializers.CharField(required=False, allow_blank=True)
    turns = BlockConversionTurnSerializer(many=True, required=False)
    context = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        block_type = attrs.get("type")
        if block_type == "paragraph":
            text = attrs.get("text")
            if not text or not text.strip():
                raise serializers.ValidationError(
                    {"text": "Los párrafos sugeridos deben incluir texto."}
                )
        elif block_type == "dialogue":
            turns = attrs.get("turns") or []
            if not turns:
                raise serializers.ValidationError(
                    {"turns": "Los diálogos sugeridos deben incluir al menos un turno."}
                )
        return attrs


class GeneralSuggestionResponseSerializer(serializers.Serializer):
    model = serializers.CharField()
    blocks = BlockConversionBlockSerializer(many=True)


class GeneralSuggestionPromptResponseSerializer(serializers.Serializer):
    prompt = serializers.CharField()


class BlockConversionRequestSerializer(serializers.Serializer):
    text = serializers.CharField()
    instructions = serializers.CharField(required=False, allow_blank=True)
    contextBlockId = serializers.CharField(required=False, allow_blank=True)


class BlockConversionResponseSerializer(serializers.Serializer):
    conversionId = serializers.CharField()
    blocks = BlockConversionBlockSerializer(many=True)


class BlockConversionApplySerializer(serializers.Serializer):
    anchorBlockId = serializers.CharField(required=False, allow_blank=True)
    placement = serializers.ChoiceField(
        choices=("before", "after", "append"),
        default="append",
    )
