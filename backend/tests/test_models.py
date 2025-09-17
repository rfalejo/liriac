from __future__ import annotations

import re
import uuid

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.library.models import (
    Book,
    Chapter,
    ChapterVersion,
    ContextProfile,
    ContextProfilePersona,
    Persona,
)
from apps.suggestions.models import (
    Suggestion,
    SuggestionEvent,
    SuggestionEventType,
    SuggestionStatus,
)

HEX_RE = re.compile(r"^[0-9a-f]{64}$")


def mk_checksum(body: str) -> str:
    import hashlib

    return hashlib.sha256(body.encode("utf-8")).hexdigest()


@pytest.mark.django_db()
def test_book_slug_unique() -> None:
    Book.objects.create(title="A", slug="same")
    with pytest.raises(IntegrityError):
        Book.objects.create(title="B", slug="same")


@pytest.mark.django_db()
def test_chapter_unique_order_per_book() -> None:
    b = Book.objects.create(title="Book", slug="book")
    Chapter.objects.create(book=b, title="One", order=1, body="", checksum=mk_checksum(""))
    with pytest.raises(IntegrityError):
        Chapter.objects.create(book=b, title="Dup", order=1, body="", checksum=mk_checksum(""))


@pytest.mark.django_db()
def test_chapter_updated_at_changes() -> None:
    b = Book.objects.create(title="Book", slug="book")
    c = Chapter.objects.create(book=b, title="One", order=1, body="x", checksum=mk_checksum("x"))
    original = c.updated_at
    c.body = "y"
    c.checksum = mk_checksum("y")
    c.save()
    assert c.updated_at >= original


@pytest.mark.django_db()
def test_persona_unique_name() -> None:
    Persona.objects.create(name="Hero")
    with pytest.raises(IntegrityError):
        Persona.objects.create(name="Hero")


@pytest.mark.django_db()
def test_context_profile_one_to_one_and_persona_link_unique() -> None:
    b = Book.objects.create(title="Book", slug="book")
    c = Chapter.objects.create(book=b, title="Ch", order=1, body="", checksum=mk_checksum(""))
    cp = ContextProfile.objects.create(chapter=c)
    p = Persona.objects.create(name="Hero")
    ContextProfilePersona.objects.create(context_profile=cp, persona=p)
    with pytest.raises(IntegrityError):
        ContextProfilePersona.objects.create(context_profile=cp, persona=p)


@pytest.mark.django_db()
def test_context_profile_included_chapters_many() -> None:
    b = Book.objects.create(title="Book", slug="book")
    c1 = Chapter.objects.create(book=b, title="Ch1", order=1, body="", checksum=mk_checksum(""))
    c2 = Chapter.objects.create(book=b, title="Ch2", order=2, body="", checksum=mk_checksum(""))
    c3 = Chapter.objects.create(book=b, title="Ch3", order=3, body="", checksum=mk_checksum(""))
    cp = ContextProfile.objects.create(chapter=c1)
    cp.included_chapters.set([c2, c3])
    assert cp.included_chapters.count() == 2


@pytest.mark.django_db()
def test_suggestion_session_unique_and_status_choices() -> None:
    b = Book.objects.create(title="Book", slug="book")
    c = Chapter.objects.create(book=b, title="Ch", order=1, body="", checksum=mk_checksum(""))
    sid = uuid.uuid4()
    s = Suggestion.objects.create(chapter=c, session_id=sid)
    assert s.status == SuggestionStatus.PENDING
    # Attempt duplicate inside its own atomic block so IntegrityError rolls back separately
    with pytest.raises(IntegrityError):
        Suggestion.objects.create(chapter=c, session_id=sid)


@pytest.mark.django_db()
def test_suggestion_events_ordering() -> None:
    b = Book.objects.create(title="Book", slug="book")
    c = Chapter.objects.create(book=b, title="Ch", order=1, body="", checksum=mk_checksum(""))
    s = Suggestion.objects.create(chapter=c, session_id=uuid.uuid4())
    e1 = SuggestionEvent.objects.create(suggestion=s, event_type=SuggestionEventType.DELTA, payload={"v": 1})
    e2 = SuggestionEvent.objects.create(suggestion=s, event_type=SuggestionEventType.DONE, payload={})
    events = list(s.events.all())
    assert events == [e1, e2]


@pytest.mark.django_db()
def test_chapter_version_checksum_and_diff_size() -> None:
    b = Book.objects.create(title="Book", slug="book")
    c = Chapter.objects.create(book=b, title="Ch", order=1, body="Hello", checksum=mk_checksum("Hello"))
    v = ChapterVersion.objects.create(
        chapter=c, body="Hello world", checksum=mk_checksum("Hello world"), diff_size=6
    )
    assert HEX_RE.match(v.checksum)


@pytest.mark.django_db()
def test_chapter_checksum_validation() -> None:
    b = Book.objects.create(title="Book", slug="book")
    with pytest.raises(ValidationError):
        ch = Chapter(
            book=b,
            title="Bad",
            order=1,
            body="",
            checksum="not-a-valid-checksum",
        )
        ch.full_clean()
