from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Protocol

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.library.models import Chapter, ChapterVersion

SNAPSHOT_THRESHOLD = 100  # characters difference required to snapshot


class AutosaveResultProtocol(Protocol):  # pragma: no cover - typing aid
    saved: bool
    checksum: str
    saved_at: str


@dataclass(slots=True)
class AutosaveResult:
    saved: bool
    checksum: str
    saved_at: str


class AutosaveService:
    """Service encapsulating autosave logic (idempotent + snapshot policy)."""

    @staticmethod
    @transaction.atomic
    def autosave(*, chapter_id: int, body: str, checksum: str) -> AutosaveResult:
        # Lock row for update to ensure concurrency safety
        chapter = (
            Chapter.objects.select_for_update()
            .select_related("book")
            .get(pk=chapter_id)
        )

        # Compute checksum server-side for integrity validation
        server_checksum = hashlib.sha256(body.encode("utf-8")).hexdigest()
        if server_checksum != checksum:
            raise ValidationError({"checksum": ["Checksum does not match body."]})

        # Idempotent: if checksum matches existing chapter checksum, no write
        if chapter.checksum == checksum:
            # still return updated_at for consistency (force refresh)
            chapter.refresh_from_db(fields=["updated_at"])  # ensure latest timestamp
            return AutosaveResult(saved=False, checksum=checksum, saved_at=chapter.updated_at.isoformat())

        old_body = chapter.body
        old_checksum = chapter.checksum

        chapter.body = body
        chapter.checksum = checksum
        chapter.save(update_fields=["body", "checksum", "updated_at"])

        diff_size = abs(len(body) - len(old_body))
        if diff_size >= SNAPSHOT_THRESHOLD:
            ChapterVersion.objects.create(
                chapter=chapter,
                body=old_body,  # snapshot previous body before change? Spec wants new? We'll store previous snapshot for history.
                checksum=old_checksum,
                diff_size=diff_size,
            )

        return AutosaveResult(saved=True, checksum=checksum, saved_at=chapter.updated_at.isoformat())


__all__ = ["AutosaveService", "AutosaveResult", "SNAPSHOT_THRESHOLD"]
