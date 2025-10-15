from __future__ import annotations

from typing import Any, Dict
from uuid import uuid4

from django.core.serializers.json import DjangoJSONEncoder
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .payloads import (
    ChapterBlockPayload,
    ChapterDetailPayload,
    ChapterSummaryPayload,
    ContextItemPayload,
    ContextSectionPayload,
    LibraryBookPayload,
    chapter_detail_from_blocks,
)


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class LibrarySection(TimeStampedModel):
    id = models.CharField(primary_key=True, max_length=64)
    book = models.ForeignKey(
        "studio.Book",
        related_name="context_sections",
        on_delete=models.CASCADE,
    )
    slug = models.CharField(max_length=64)
    title = models.CharField(max_length=255)
    default_open = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["book", "order", "slug"]
        constraints = [
            models.UniqueConstraint(fields=["book", "slug"], name="uniq_section_book_slug"),
        ]

    def __str__(self) -> str:
        return self.title

    def to_payload(self) -> ContextSectionPayload:
        items = [item.to_payload() for item in self.items.all()]
        return {
            "id": self.slug,
            "title": self.title,
            "defaultOpen": self.default_open,
            "items": items,
        }


class ContextItemType(models.TextChoices):
    CHARACTER = "character", "Character"
    WORLD = "world", "World"
    STYLE_TONE = "styleTone", "Style & Tone"
    CHAPTER = "chapter", "Chapter"


class LibraryContextItem(TimeStampedModel):
    section = models.ForeignKey(
        LibrarySection,
        related_name="items",
        on_delete=models.CASCADE,
    )
    chapter = models.ForeignKey(
        "studio.Chapter",
        related_name="context_items",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    item_id = models.CharField(max_length=64)
    item_type = models.CharField(
        max_length=32,
        choices=ContextItemType.choices,
    )
    name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=255, blank=True)
    summary = models.TextField(blank=True)
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    facts = models.TextField(blank=True)
    tokens = models.PositiveIntegerField(null=True, blank=True)
    checked = models.BooleanField(default=False)
    disabled = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["section", "order", "item_id"]
        unique_together = ("section", "item_id")

    def __str__(self) -> str:
        return f"{self.item_type}:{self.item_id}"

    def to_payload(self) -> ContextItemPayload:
        payload: ContextItemPayload = {
            "id": self.item_id,
            "type": self.item_type,
            "checked": self.checked,
            "disabled": self.disabled,
        }
        if self.chapter_id:
            payload["chapterId"] = self.chapter_id
        if self.name:
            payload["name"] = self.name
        if self.role:
            payload["role"] = self.role
        if self.summary:
            payload["summary"] = self.summary
        if self.title:
            payload["title"] = self.title
        if self.description:
            payload["description"] = self.description
        if self.facts:
            payload["facts"] = self.facts
        if self.tokens is not None:
            payload["tokens"] = int(self.tokens)
        return payload


class Book(TimeStampedModel):
    id = models.CharField(primary_key=True, max_length=64)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    synopsis = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "title"]

    def __str__(self) -> str:
        return self.title

    def to_payload(self) -> LibraryBookPayload:
        chapters = [chapter.to_summary_payload() for chapter in self.chapters.all()]
        payload: LibraryBookPayload = {
            "id": self.id,
            "title": self.title,
            "chapters": chapters,
        }
        if self.author:
            payload["author"] = self.author
        if self.synopsis:
            payload["synopsis"] = self.synopsis
        return payload


class Chapter(TimeStampedModel):
    id = models.CharField(primary_key=True, max_length=64)
    book = models.ForeignKey(
        Book,
        related_name="chapters",
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    ordinal = models.PositiveIntegerField(default=0)
    tokens = models.PositiveIntegerField(null=True, blank=True)
    word_count = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["book", "ordinal", "id"]

    def __str__(self) -> str:
        return self.title

    def to_summary_payload(self) -> ChapterSummaryPayload:
        payload: ChapterSummaryPayload = {
            "id": self.id,
            "title": self.title,
            "ordinal": int(self.ordinal),
        }
        if self.summary:
            payload["summary"] = self.summary
        if self.tokens is not None:
            payload["tokens"] = int(self.tokens)
        if self.word_count is not None:
            payload["wordCount"] = int(self.word_count)
        return payload

    def to_detail_payload(self) -> ChapterDetailPayload:
        blocks = [block.to_payload() for block in self.blocks.all()]
        return chapter_detail_from_blocks(
            chapter_id=self.id,
            title=self.title,
            summary=self.summary or None,
            ordinal=int(self.ordinal),
            tokens=int(self.tokens) if self.tokens is not None else None,
            word_count=int(self.word_count) if self.word_count is not None else None,
            blocks=blocks,
            book_id=self.book_id,
            book_title=self.book.title if self.book else None,
        )


class ChapterBlockType(models.TextChoices):
    PARAGRAPH = "paragraph", "Paragraph"
    DIALOGUE = "dialogue", "Dialogue"
    SCENE_BOUNDARY = "scene_boundary", "Scene boundary"
    METADATA = "metadata", "Metadata"


class ChapterBlock(TimeStampedModel):
    id = models.CharField(primary_key=True, max_length=64)
    chapter = models.ForeignKey(
        Chapter,
        related_name="blocks",
        on_delete=models.CASCADE,
    )
    type = models.CharField(
        max_length=32,
        choices=ChapterBlockType.choices,
    )
    position = models.IntegerField()
    payload = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    active_version = models.ForeignKey(
        "studio.ChapterBlockVersion",
        related_name="active_for_block",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    active_version_number = models.PositiveIntegerField(default=1)
    version_count = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["chapter", "position", "id"]

    def __str__(self) -> str:
        return f"{self.type}:{self.id}"

    def base_payload(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "position": int(self.position),
        }

    def to_payload(self) -> ChapterBlockPayload:
        data: ChapterBlockPayload = self.base_payload()  # type: ignore[assignment]
        active_payload: Dict[str, Any]
        if self.active_version is not None:
            active_payload = dict(self.active_version.payload or {})
        else:
            active_payload = dict(self.payload or {})
        data.update(active_payload)
        data["activeVersion"] = int(self.active_version_number or 1)
        data["versionCount"] = int(self.version_count or 1)
        return data


class ChapterBlockVersion(TimeStampedModel):
    block = models.ForeignKey(
        ChapterBlock,
        related_name="versions",
        on_delete=models.CASCADE,
    )
    version = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(999)],
    )
    payload = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ["block", "version"]
        constraints = [
            models.UniqueConstraint(fields=["block", "version"], name="uniq_block_version"),
        ]

    def __str__(self) -> str:
        return f"{self.block_id}:v{self.version}"

    def to_payload(self) -> Dict[str, Any]:
        return {
            "version": int(self.version),
            "isActive": bool(self.is_active),
            "payload": dict(self.payload or {}),
        }


class ChapterBlockConversionStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    DISCARDED = "discarded", "Discarded"
    FAILED = "failed", "Failed"


class ChapterBlockConversion(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    chapter = models.ForeignKey(
        Chapter,
        related_name="block_conversions",
        on_delete=models.CASCADE,
    )
    source_text = models.TextField()
    instructions = models.TextField(blank=True)
    context_block_id = models.CharField(max_length=64, blank=True)
    provider = models.CharField(max_length=64, default="gemini")
    model_name = models.CharField(max_length=128, blank=True)
    status = models.CharField(
        max_length=16,
        choices=ChapterBlockConversionStatus.choices,
        default=ChapterBlockConversionStatus.PENDING,
    )
    suggested_blocks = models.JSONField(default=list, encoder=DjangoJSONEncoder)
    applied_block_ids = models.JSONField(default=list, encoder=DjangoJSONEncoder, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"conversion:{self.id}:{self.chapter_id}:{self.status}"

    def mark_failed(self, *, message: str) -> None:
        self.status = ChapterBlockConversionStatus.FAILED
        self.error_message = message
        self.save(update_fields=["status", "error_message", "updated_at"])

    def mark_accepted(self, *, block_ids: list[str]) -> None:
        self.status = ChapterBlockConversionStatus.ACCEPTED
        self.applied_block_ids = block_ids
        self.save(update_fields=["status", "applied_block_ids", "updated_at"])


class ChapterContextVisibility(TimeStampedModel):
    chapter = models.ForeignKey(
        Chapter,
        related_name="context_visibilities",
        on_delete=models.CASCADE,
    )
    context_item = models.ForeignKey(
        LibraryContextItem,
        related_name="chapter_visibilities",
        on_delete=models.CASCADE,
    )
    visible = models.BooleanField(default=True)

    class Meta:
        ordering = ["chapter", "context_item__section__order", "context_item__order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["chapter", "context_item"],
                name="uniq_chapter_context_visibility",
            )
        ]

    def __str__(self) -> str:
        return f"{self.chapter_id}:{self.context_item_id}:{'on' if self.visible else 'off'}"
