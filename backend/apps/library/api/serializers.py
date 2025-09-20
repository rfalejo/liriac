from __future__ import annotations

import re
from typing import Any

from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from ..models import HEX_CHECKSUM_RE, Book, Chapter, Persona


class BookSerializer(serializers.ModelSerializer[Book]):
    # Override to accept any string and normalize to slug in validate_slug, ensure uniqueness
    slug = serializers.CharField(
        max_length=200,
        validators=[UniqueValidator(queryset=Book.objects.all())],
    )
    class Meta:
        model = Book
        fields = ["id", "title", "slug", "created_at", "last_opened"]
        read_only_fields = ["id", "created_at", "last_opened"]

    def validate_slug(self, value: str) -> str:  # noqa: D401
        normalized = slugify(value) if value else ""
        if not normalized:
            raise serializers.ValidationError("Slug cannot be empty after normalization")
        return normalized


class ChapterListSerializer(serializers.ModelSerializer[Chapter]):
    class Meta:
        model = Chapter
        fields = ["id", "title", "order", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class ChapterDetailSerializer(serializers.ModelSerializer[Chapter]):
    # Explicit annotation for mypy without generics (DRF field not subscriptable by default types)
    book: serializers.PrimaryKeyRelatedField = serializers.PrimaryKeyRelatedField(read_only=True)  # type: ignore[type-arg]

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


class AutosaveSerializer(serializers.Serializer):  # type: ignore[type-arg]
    body = serializers.CharField(allow_blank=True)
    checksum = serializers.CharField(max_length=64)

    def validate_checksum(self, value: str) -> str:  # noqa: D401
        if not re.match(HEX_CHECKSUM_RE, value):
            raise serializers.ValidationError("Invalid checksum format")
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:  # noqa: D401
        # Body/checksum consistency will be re-validated in service; keep lightweight here.
        return attrs
