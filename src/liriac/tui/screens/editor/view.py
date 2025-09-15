"""Editor screen view for chapter text editing with manual save.

Implements a minimal text editor that loads chapter content, allows editing,
and provides manual save functionality with dirty state tracking.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING

from textual import on
from textual.app import ComposeResult
from textual.containers import Vertical
from textual.screen import Screen
from textual.widgets import Footer, Header, Static, TextArea

from ....domain.entities import Chapter

if TYPE_CHECKING:
    from ....domain.ports import ChapterRepository
    from ....domain.value_objects import ChapterRef


class EditorScreen(Screen[None]):
    """Text editor screen for chapter content with manual save.

    Provides a full-screen text editing interface with:
    - Scrollable, editable text area
    - Status bar showing file path and dirty state indicator
    - Manual save with Ctrl+S
    - Escape to return to previous screen
    """

    BINDINGS = [
        ("ctrl+s,s", "save", "Save"),
        ("escape", "app.pop_screen", "Back"),
    ]

    def __init__(
        self,
        library_path: Path,
        repo: ChapterRepository,
        ref: ChapterRef,
    ) -> None:
        """Initialize the editor screen with chapter reference.

        Args:
            library_path: Path to the library directory
            repo: Repository for chapter read/write operations
            ref: Reference to the chapter to edit
        """
        super().__init__()
        self.library_path = library_path
        self.repo = repo
        self.ref = ref
        self.chapter: Chapter | None = None
        self.is_dirty = False

    def compose(self) -> ComposeResult:
        """Compose the editor screen layout."""
        yield Header()
        yield Vertical(
            Static(id="status-bar"),
            TextArea(id="editor", show_line_numbers=True),
        )
        yield Footer()

    def on_mount(self) -> None:
        """Load chapter content when the screen is mounted."""
        try:
            self.chapter = self.repo.read_chapter(self.library_path, self.ref)
            editor = self.query_one("#editor", TextArea)
            editor.text = self.chapter.text
            self._update_status()
        except Exception as e:
            self.app.log.error(f"Failed to load chapter: {e}")
            self.notify(f"Error loading chapter: {e}", severity="error")

    @on(TextArea.Changed)
    def on_text_changed(self, event: TextArea.Changed) -> None:
        """Handle text changes to update dirty state.

        Args:
            event: TextArea change event
        """
        if self.chapter is not None:
            editor = self.query_one("#editor", TextArea)
            self.is_dirty = editor.text != self.chapter.text
            self._update_status()

    def action_save(self) -> None:
        """Save the current chapter content to disk."""
        if self.chapter is None:
            self.notify("No chapter loaded", severity="error")
            return

        try:
            editor = self.query_one("#editor", TextArea)

            # Create updated chapter with new content and timestamp
            updated_chapter = Chapter(
                id=self.chapter.id,
                title=self.chapter.title,
                ref=self.chapter.ref,
                text=editor.text,
                updated_at=datetime.now(UTC),
            )

            # Write to disk
            self.repo.write_chapter(self.library_path, updated_chapter)

            # Update internal state - the chapter text should match what's in the editor
            # after successful save, regardless of trailing newlines added by the repo
            self.chapter = updated_chapter
            self.is_dirty = False
            self._update_status()

            self.notify("Chapter saved", severity="information")

        except Exception as e:
            self.app.log.error(f"Failed to save chapter: {e}")
            self.notify(f"Error saving chapter: {e}", severity="error")

    def _update_status(self) -> None:
        """Update the status bar with current file info and dirty state."""
        if self.chapter is None:
            status_text = "No chapter loaded"
        else:
            dirty_indicator = " [red]*[/red]" if self.is_dirty else ""
            file_path = f"{self.ref.book_id}/{self.ref.relative_path}"
            status_text = f"[dim]File:[/dim] {file_path}{dirty_indicator}"

        status_bar = self.query_one("#status-bar", Static)
        status_bar.update(status_text)


__all__ = [
    "EditorScreen",
]
