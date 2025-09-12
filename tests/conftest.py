"""Configuration for pytest and test fixtures.

This module provides common configuration and reusable test fixtures
for use across the liriac test suite.
"""

import pytest
from typing import Any, Dict


@pytest.fixture
def sample_book_metadata() -> Dict[str, Any]:
    """Sample book metadata for testing."""
    return {
        "title": "Test Novel",
        "slug": "test-novel",
        "genre": "fantasy",
        "audience": "young-adult",
        "tone": "adventure",
    }


@pytest.fixture
def sample_chapter_data() -> Dict[str, Any]:
    """Sample chapter data for testing."""
    return {
        "id": "ch_01",
        "number": 1,
        "title": "Prologue",
        "pov": "narrator",
        "synopsis": "The beginning of an epic tale",
    }
