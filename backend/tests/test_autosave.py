from __future__ import annotations

import hashlib

import pytest
from rest_framework.test import APIClient

from apps.library.models import Book, Chapter, ChapterVersion


def mk_checksum(body: str) -> str:
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


@pytest.mark.django_db()
def test_autosave_idempotent_and_snapshot_threshold() -> None:
    client = APIClient()
    book = Book.objects.create(title="Book", slug="book")
    body1 = "Hello world" * 5
    ch = Chapter.objects.create(book=book, title="Ch1", order=1, body=body1, checksum=mk_checksum(body1))

    # Idempotent (same body/checksum)
    resp_same = client.post(
        f"/api/v1/chapters/{ch.id}/autosave/",
        {"body": body1, "checksum": mk_checksum(body1)},
        format="json",
    )
    assert resp_same.status_code == 200
    data_same = resp_same.json()
    assert data_same["saved"] is False
    assert ChapterVersion.objects.count() == 0

    # Change below threshold (<100 diff)
    new_body_small = body1 + "!" * 10
    resp_small = client.post(
        f"/api/v1/chapters/{ch.id}/autosave/",
        {"body": new_body_small, "checksum": mk_checksum(new_body_small)},
        format="json",
    )
    assert resp_small.status_code == 200
    data_small = resp_small.json()
    assert data_small["saved"] is True
    assert ChapterVersion.objects.count() == 0  # no snapshot

    # Large change triggers snapshot (>=100 diff)
    new_body_large = new_body_small + "X" * 150
    resp_large = client.post(
        f"/api/v1/chapters/{ch.id}/autosave/",
        {"body": new_body_large, "checksum": mk_checksum(new_body_large)},
        format="json",
    )
    assert resp_large.status_code == 200
    data_large = resp_large.json()
    assert data_large["saved"] is True
    assert ChapterVersion.objects.count() == 1


@pytest.mark.django_db()
def test_autosave_invalid_checksum_format_and_mismatch() -> None:
    client = APIClient()
    book = Book.objects.create(title="Book", slug="book")
    body = "Body"
    ch = Chapter.objects.create(book=book, title="Ch1", order=1, body=body, checksum=mk_checksum(body))

    # Invalid format
    resp_bad_format = client.post(
        f"/api/v1/chapters/{ch.id}/autosave/",
        {"body": body, "checksum": "not-64-hex"},
        format="json",
    )
    assert resp_bad_format.status_code == 400

    # Mismatch
    resp_mismatch = client.post(
        f"/api/v1/chapters/{ch.id}/autosave/",
        {"body": body, "checksum": mk_checksum(body + "x")},
        format="json",
    )
    assert resp_mismatch.status_code == 400
