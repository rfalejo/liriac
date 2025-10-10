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
