from __future__ import annotations

import hashlib

import pytest
from rest_framework.test import APIClient

from apps.library.models import Book, Chapter, Persona


def checksum(body: str) -> str:
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


@pytest.mark.django_db()
def test_books_list_create_and_search_ordering() -> None:
    client = APIClient()
    Book.objects.create(title="B Title", slug="b-title")
    Book.objects.create(title="A Title", slug="a-title")

    # List default ordering (by title ascending per model ordering)
    resp = client.get("/api/v1/books/?ordering=title")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 2
    titles = [b["title"] for b in data["results"]]
    assert titles == ["A Title", "B Title"]

    # Search
    resp2 = client.get("/api/v1/books/?search=a-title")
    assert resp2.status_code == 200
    assert resp2.json()["count"] == 1

    # Create
    resp3 = client.post(
        "/api/v1/books/",
        {"title": "El viajero", "slug": "el-viajero"},
        format="json",
    )
    assert resp3.status_code == 201
    assert resp3.json()["slug"] == "el-viajero"


@pytest.mark.django_db()
def test_chapters_nested_list_create_and_detail_patch_restrict_body_checksum() -> None:
    client = APIClient()
    book = Book.objects.create(title="Book", slug="book")
    c1 = Chapter.objects.create(book=book, title="One", order=1, body="Hello", checksum=checksum("Hello"))
    Chapter.objects.create(book=book, title="Two", order=2, body="World", checksum=checksum("World"))

    # List under book
    resp = client.get(f"/api/v1/books/{book.id}/chapters/?ordering=order")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 2
    assert all("body" not in ch for ch in data["results"])  # list serializer excludes body

    # Create new chapter under book
    resp_create = client.post(
        f"/api/v1/books/{book.id}/chapters/",
        {
            "title": "Three",
            "order": 3,
            "body": "Third body",
            "checksum": checksum("Third body"),
        },
        format="json",
    )
    assert resp_create.status_code == 201
    assert resp_create.json()["title"] == "Three"

    # Detail includes body/checksum
    resp_detail = client.get(f"/api/v1/chapters/{c1.id}/")
    assert resp_detail.status_code == 200
    detail = resp_detail.json()
    assert "body" in detail and "checksum" in detail

    # Patch only title/order allowed
    resp_patch = client.patch(
        f"/api/v1/chapters/{c1.id}/",
        {"title": "One Revised", "order": 10},
        format="json",
    )
    assert resp_patch.status_code == 200
    assert resp_patch.json()["title"] == "One Revised"

    # Attempt to patch body should fail
    resp_bad = client.patch(
        f"/api/v1/chapters/{c1.id}/",
        {"body": "New body"},
        format="json",
    )
    assert resp_bad.status_code == 400


@pytest.mark.django_db()
def test_personas_list_create_search_and_patch() -> None:
    client = APIClient()
    p = Persona.objects.create(name="Hero", role="protagonist")
    Persona.objects.create(name="Villain", role="antagonist")

    resp = client.get("/api/v1/personas/?ordering=name")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 2
    names = [row["name"] for row in data["results"]]
    assert names == ["Hero", "Villain"]

    # Search
    resp_search = client.get("/api/v1/personas/?search=protagonist")
    assert resp_search.status_code == 200
    assert resp_search.json()["count"] == 1

    # Create
    resp_create = client.post("/api/v1/personas/", {"name": "Guide", "role": "mentor"}, format="json")
    assert resp_create.status_code == 201

    # Patch role/notes
    resp_patch = client.patch(f"/api/v1/personas/{p.id}/", {"role": "lead"}, format="json")
    assert resp_patch.status_code == 200
    assert resp_patch.json()["role"] == "lead"
