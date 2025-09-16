"""Suggestions service package.

Provides orchestration for AI-generated suggestions including streaming,
regeneration, acceptance, and logging utilities.
"""

from .acceptance import merge_text, write_log
from .history import SuggestionsHistory
from .orchestrator import SuggestionsService

__all__ = [
    "SuggestionsService",
    "SuggestionsHistory",
    "merge_text",
    "write_log",
]
