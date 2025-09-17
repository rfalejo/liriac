from __future__ import annotations

from typing import Any

from django.core import validators
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify

HEX_CHECKSUM_RE = r"^[0-9a-f]{64}$"


class Book(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_opened = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["title", "created_at"]

    def save(self, *args: Any, **kwargs: Any) -> None:  # noqa: D401
        # Normalize slug (defensive; serializers may enforce later)
        if self.slug:
            self.slug = slugify(self.slug)
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.title}"


class Chapter(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="chapters")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(db_index=True)
    body = models.TextField(default="", blank=True)
    checksum = models.CharField(
        max_length=64,
        validators=[validators.RegexValidator(regex=HEX_CHECKSUM_RE, message="Invalid checksum")],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["book", "order"], name="chapter_book_order_unique"),
        ]
        indexes = [
            models.Index(fields=["book", "order"], name="chapter_book_order_idx"),
        ]
        ordering = ["book_id", "order"]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.book.title}#{self.order}: {self.title}" if self.book_id else self.title


class Persona(models.Model):
    name = models.CharField(max_length=100, unique=True)
    role = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.name


class ContextProfile(models.Model):
    chapter = models.OneToOneField(
        Chapter, on_delete=models.CASCADE, related_name="context_profile"
    )
    personas: models.ManyToManyField[Persona, ContextProfilePersona] = models.ManyToManyField(
        Persona,
        through="ContextProfilePersona",
        related_name="context_profiles",
        blank=True,
    )
    included_chapters: models.ManyToManyField[Chapter, models.Model] = models.ManyToManyField(
        Chapter,
        related_name="context_in_profiles",
        symmetrical=False,
        blank=True,
    )
    tokens_estimated = models.PositiveIntegerField(default=0)
    token_limit = models.PositiveIntegerField(default=8000)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"ContextProfile(chapter={self.chapter.pk})"


class ContextProfilePersona(models.Model):
    context_profile = models.ForeignKey(
        ContextProfile, on_delete=models.CASCADE, related_name="persona_links"
    )
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE, related_name="profile_links")
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["context_profile", "persona"], name="ctx_profile_persona_unique"
            ),
        ]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return (
            f"CP{self.context_profile.pk}-P{self.persona.pk}:{'on' if self.enabled else 'off'}"
        )


class ChapterVersion(models.Model):
    """Snapshot of a chapter body. (Placed here for simplicity, could live in autosave app.)"""

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="versions")
    body = models.TextField()
    checksum = models.CharField(
        max_length=64,
        validators=[validators.RegexValidator(regex=HEX_CHECKSUM_RE, message="Invalid checksum")],
    )
    diff_size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["chapter", "created_at"], name="chapter_version_idx")]

    def clean(self) -> None:
        if self.diff_size < 0:  # pragma: no cover - defensive; PositiveIntegerField already enforces
            raise ValidationError("diff_size must be >= 0")

    def __str__(self) -> str:  # pragma: no cover - trivial
        return (
            f"{self.chapter.pk}@{self.created_at:%Y-%m-%d %H:%M:%S}" if self.pk else "<unsaved>"
        )


__all__ = [
    "Book",
    "Chapter",
    "Persona",
    "ContextProfile",
    "ContextProfilePersona",
    "ChapterVersion",
]
