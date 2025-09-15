"""Autosave service package.

Provides debounced, idempotent autosave functionality with snapshots.
"""

from .scheduler import AutosaveScheduler

__all__ = [
    "AutosaveScheduler",
]
