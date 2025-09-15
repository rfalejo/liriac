"""Content normalization and hashing utilities for autosave.

Provides utilities for normalizing text content and computing content hashes
for idempotent save operations.
"""

from __future__ import annotations

import hashlib


def normalize_text(text: str) -> str:
    """Normalize text content by ensuring exactly one trailing newline.

    Args:
        text: Raw text content to normalize

    Returns:
        Normalized text with exactly one trailing newline
    """
    return text.rstrip("\n") + "\n"


def content_hash(text: str) -> str:
    """Compute SHA256 hash of normalized text content.

    Args:
        text: Text content to hash

    Returns:
        Hexadecimal SHA256 hash of the normalized text
    """
    normalized = normalize_text(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


__all__ = [
    "normalize_text",
    "content_hash",
]
