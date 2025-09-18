from __future__ import annotations

import json

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db()
def test_openapi_schema_smoke() -> None:
    client = APIClient()
    resp = client.get("/api/schema/?format=json")
    assert resp.status_code == 200
    # drf-spectacular returns vendor content-type; use raw bytes
    data = json.loads(resp.content.decode("utf-8"))
    assert data["openapi"].startswith("3.")
    # Basic top-level assertions
    assert data["info"]["title"] == "Liriac API"
    assert data["info"]["version"] == "1.0.0"
    # Ensure critical paths exist (subset)
    required_paths = [
        "/api/v1/books/",
        "/api/v1/books/{book_pk}/chapters/",
        "/api/v1/chapters/{id}/autosave/",
        "/api/v1/personas/",
        "/api/v1/health/",
    ]
    missing = [p for p in required_paths if p not in data.get("paths", {})]
    assert not missing, f"Missing paths in schema: {missing}"
