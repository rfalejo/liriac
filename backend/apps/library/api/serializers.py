from __future__ import annotations

from typing import Any

from django.utils.text import slugify
from rest_framework import serializers

from ..models import Book, Chapter, Persona, HEX_CHECKSUM_RE


class BookSerializer(serializers.ModelSerializer[Book]):
    class Meta:
        model = Book
        fields = ["id", "title", "slug", "created_at", "last_opened"]
        read_only_fields = ["id", "created_at", "last_opened"]

    def validate_slug(self, value: str) -> str:  # noqa: D401
        return slugify(value) if value else value


class ChapterListSerializer(serializers.ModelSerializer[Chapter]):
    class Meta:
        model = Chapter
        fields = ["id", "title", "order", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class ChapterDetailSerializer(serializers.ModelSerializer[Chapter]):
    book = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Chapter
        fields = [
            "id",
            "book",
            "title",
            "order",
            "body",
            "checksum",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "book", "created_at", "updated_at"]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:  # noqa: D401
        # For PATCH operations, ensure body/checksum are not changed (ticket scope)
        request = self.context.get("request")
        if request and request.method in {"PATCH", "PUT"}:
            if any(k in attrs for k in ("body", "checksum")):
                raise serializers.ValidationError(
                    {"non_field_errors": ["Body/checksum modifications not allowed in this endpoint."]}
                )
        return attrs


class ChapterCreateSerializer(serializers.ModelSerializer[Chapter]):
    class Meta:
        model = Chapter
        fields = ["id", "title", "order", "body", "checksum", "updated_at"]
        read_only_fields = ["id", "updated_at"]

    def validate_checksum(self, value: str) -> str:  # noqa: D401
        import re

        if not re.match(HEX_CHECKSUM_RE, value):
            raise serializers.ValidationError("Invalid checksum format")
        return value


class PersonaSerializer(serializers.ModelSerializer[Persona]):
    class Meta:
        model = Persona
        fields = ["id", "name", "role", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value: str) -> str:  # noqa: D401
        return value.strip()
