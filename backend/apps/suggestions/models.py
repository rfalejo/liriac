from __future__ import annotations

from django.db import models

from apps.library.models import Chapter


class SuggestionStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"


class SuggestionEventType(models.TextChoices):
    DELTA = "delta", "Delta"
    USAGE = "usage", "Usage"
    DONE = "done", "Done"
    ERROR = "error", "Error"


class Suggestion(models.Model):
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="suggestions"
    )
    session_id = models.UUIDField(unique=True, db_index=True)
    status = models.CharField(
        max_length=16, choices=SuggestionStatus.choices, default=SuggestionStatus.PENDING
    )
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["chapter", "created_at"], name="sugg_chap_created_idx"),
        ]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"Suggestion({self.session_id})"


class SuggestionEvent(models.Model):
    suggestion = models.ForeignKey(
        Suggestion, on_delete=models.CASCADE, related_name="events"
    )
    event_type = models.CharField(max_length=16, choices=SuggestionEventType.choices)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(
                fields=["suggestion", "created_at"], name="sugg_event_created_idx"
            ),
        ]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.suggestion.pk}:{self.event_type}" if self.pk else "<unsaved event>"


__all__ = ["Suggestion", "SuggestionEvent", "SuggestionStatus", "SuggestionEventType"]
