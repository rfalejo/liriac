"""Suggestions service package.

Provides orchestration for AI-generated suggestions including streaming,
regeneration, acceptance, and logging utilities.
"""

from .orchestrator import SuggestionsService
from .history import SuggestionsHistory
from .acceptance import merge_text, write_log

__all__ = [
    "SuggestionsService",
    "SuggestionsHistory",
    "merge_text",
    "write_log",
]
