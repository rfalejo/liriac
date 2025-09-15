"""Autosave scheduler with debouncing and idempotent hashing.

Provides the main AutosaveScheduler class that coordinates debounced saves,
content hashing for idempotency, and snapshot generation when changes
exceed configured thresholds.
"""

from __future__ import annotations

import threading
from datetime import UTC, datetime
from pathlib import Path

from ...domain.entities.chapter import Chapter
from ...domain.ports import ChapterRepository
from ...domain.types import ChapterId
from ...domain.value_objects import ChapterRef
from .snapshots import write_snapshot
from .writer import content_hash, normalize_text


class AutosaveScheduler:
    """Debounced, idempotent autosave scheduler for chapter content.

    Schedules writes with debouncing to coalesce rapid edits, uses content
    hashing to avoid redundant writes, and creates snapshots when content
    changes exceed configured thresholds.
    """

    def __init__(
        self,
        library_path: Path,
        repo: ChapterRepository,
        debounce_seconds: float = 10.0,
        snapshot_threshold: int = 100,
    ) -> None:
        """Initialize the autosave scheduler.

        Args:
            library_path: Path to the library directory
            repo: Chapter repository for persistence
            debounce_seconds: Delay in seconds before executing a save
            snapshot_threshold: Minimum character difference to trigger snapshot
        """
        self._library_path = library_path
        self._repo = repo
        self._debounce_seconds = debounce_seconds
        self._snapshot_threshold = snapshot_threshold

        # Per-ref state tracking
        self._ref_state: dict[ChapterRef, _RefState] = {}
        self._lock = threading.RLock()

    def schedule(self, ref: ChapterRef, text: str) -> None:
        """Schedule a debounced save for the given chapter reference.

        Args:
            ref: Chapter reference to save
            text: Chapter text content to save

        Returns:
            None
        """
        with self._lock:
            normalized_text = normalize_text(text)
            current_hash = content_hash(normalized_text)

            # Get or create ref state
            if ref not in self._ref_state:
                self._ref_state[ref] = _RefState()

            state = self._ref_state[ref]

            # Check if content has changed since last save
            if state.last_saved_hash == current_hash:
                # Content unchanged, no need to save
                return

            # Cancel any existing timer
            if state.pending_timer is not None:
                state.pending_timer.cancel()

            # Update state with new content
            state.last_text = normalized_text

            # Schedule new debounced save
            state.pending_timer = threading.Timer(
                self._debounce_seconds,
                self._execute_save,
                args=(ref,),
            )
            state.pending_timer.start()

    def flush(self, ref: ChapterRef | None = None) -> None:
        """Immediately execute pending saves.

        Args:
            ref: Specific chapter reference to flush, or None for all

        Returns:
            None
        """
        with self._lock:
            if ref is not None:
                # Flush specific ref
                if ref in self._ref_state:
                    self._execute_save_locked(ref)
            else:
                # Flush all refs
                for chapter_ref in list(self._ref_state.keys()):
                    self._execute_save_locked(chapter_ref)

    def shutdown(self, flush: bool = False) -> None:
        """Shutdown the scheduler, canceling all timers.

        Args:
            flush: Whether to flush pending saves before canceling

        Returns:
            None
        """
        with self._lock:
            if flush:
                self.flush()

            # Cancel all pending timers
            for state in self._ref_state.values():
                if state.pending_timer is not None:
                    state.pending_timer.cancel()
                    state.pending_timer = None

    def _execute_save(self, ref: ChapterRef) -> None:
        """Execute save for a chapter reference (thread-safe wrapper).

        Args:
            ref: Chapter reference to save

        Returns:
            None
        """
        with self._lock:
            self._execute_save_locked(ref)

    def _execute_save_locked(self, ref: ChapterRef) -> None:
        """Execute save for a chapter reference (must hold lock).

        Args:
            ref: Chapter reference to save

        Returns:
            None
        """
        if ref not in self._ref_state:
            return

        state = self._ref_state[ref]

        # Cancel timer if still pending
        if state.pending_timer is not None:
            state.pending_timer.cancel()
            state.pending_timer = None

        # Check if we have content to save
        if state.last_text is None:
            return

        current_hash = content_hash(state.last_text)

        # Check if already saved
        if state.last_saved_hash == current_hash:
            return

        try:
            # Build Chapter entity
            chapter_id = ChapterId(ref.relative_path.stem)
            chapter = Chapter(
                id=chapter_id,
                title=ref.relative_path.stem,
                ref=ref,
                text=state.last_text,
                updated_at=datetime.now(UTC),
            )

            # Check if we need to create a snapshot
            should_snapshot = self._should_create_snapshot(state, state.last_text)

            # Persist chapter
            self._repo.write_chapter(self._library_path, chapter)

            # Create snapshot if needed
            if should_snapshot:
                write_snapshot(
                    self._library_path,
                    ref,
                    state.last_text,
                    datetime.now(UTC),
                )

            # Update state on successful save
            state.last_saved_hash = current_hash
            state.last_saved_text = state.last_text

        except Exception:
            # Fail silently on save errors to avoid blocking the scheduler
            # In a production system, this would be logged
            pass

    def _should_create_snapshot(self, state: _RefState, new_text: str) -> bool:
        """Determine if a snapshot should be created based on content change.

        Args:
            state: Current ref state
            new_text: New text content

        Returns:
            True if a snapshot should be created
        """
        if state.last_saved_text is None:
            # First save, no previous content to compare against
            return False

        # Calculate character difference
        old_len = len(state.last_saved_text)
        new_len = len(new_text)
        char_diff = abs(new_len - old_len)

        return char_diff >= self._snapshot_threshold


class _RefState:
    """Internal state tracking for a chapter reference."""

    def __init__(self) -> None:
        """Initialize empty ref state."""
        self.last_saved_hash: str | None = None
        self.last_saved_text: str | None = None
        self.last_text: str | None = None
        self.pending_timer: threading.Timer | None = None


__all__ = [
    "AutosaveScheduler",
]
