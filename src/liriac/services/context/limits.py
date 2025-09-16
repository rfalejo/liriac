"""Token estimation and context limits for AI generation."""

from __future__ import annotations

from pathlib import Path

from liriac.domain.ports import ChapterRepository
from liriac.domain.types import ContextProfile


def estimate_tokens(text: str) -> int:
    """Estimate tokens using a simple character-to-token heuristic.

    Uses a basic heuristic of approximately 4 characters per token.
    This provides a rough estimate suitable for context management.

    Args:
        text: Input text to estimate tokens for

    Returns:
        Estimated number of tokens (minimum 1 for non-empty text)
    """
    if not text:
        return 0
    return max(1, round(len(text) / 4))


def estimate_profile_tokens(
    library_path: Path,
    repo: ChapterRepository,
    profile: ContextProfile,
) -> int:
    """Estimate total tokens for a ContextProfile by reading included chapters.

    Reads all selected chapters via the repository, combines their text content
    with the system prompt, and returns a token estimate.

    Args:
        library_path: Path to the library root
        repo: Repository for reading chapter content
        profile: ContextProfile with selected chapters and system prompt

    Returns:
        Estimated total tokens for the entire context

    Raises:
        FileNotFoundError: If any selected chapter cannot be found
        OSError: If any chapter file cannot be read
    """
    total_text = profile.system_prompt

    # Read and accumulate text from all selected chapters
    for chapter_ref in profile.chapters:
        chapter = repo.read_chapter(library_path, chapter_ref)
        total_text += "\n" + chapter.text

    # Note: personas are not yet implemented, so we ignore profile.personas

    return estimate_tokens(total_text)
