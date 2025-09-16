"""Minimal TUI app for Liriac."""

from pathlib import Path

from textual.app import App
from textual.events import Key

from .domain.types import ContextProfile
from .infra.fs.library import FilesystemLibraryRepository
from .tui import (
    ChapterChosen,
    ContextCommitted,
    ContextScreen,
    EditorScreen,
    HomeScreen,
)


class LiriacApp(App[None]):
    """Minimal Liriac TUI application."""

    def __init__(self, library_path: Path) -> None:
        super().__init__()
        self.library_path = library_path
        self.repo = FilesystemLibraryRepository()
        self.last_selection: tuple[str, str] | None = None
        self.last_context_profile: ContextProfile | None = None

    def on_mount(self) -> None:
        """Initialize the app by pushing the home screen."""
        home_screen = HomeScreen(self.library_path, self.repo)
        self.push_screen(home_screen)

    def on_chapter_chosen(self, message: ChapterChosen) -> None:
        """Handle chapter selection from the home screen.

        Args:
            message: ChapterChosen message with book and chapter info
        """
        # Store the last selection
        self.last_selection = (str(message.book_id), str(message.ref.relative_path))

        # Open the editor with the selected chapter
        editor_screen = EditorScreen(self.library_path, self.repo, message.ref)
        self.push_screen(editor_screen)

    def on_context_committed(self, message: ContextCommitted) -> None:
        """Handle context selection commitment.

        Args:
            message: ContextCommitted message with the selected context profile
        """
        self.last_context_profile = message.profile

    def on_key(self, event: Key) -> None:
        """Handle key events."""
        if event.key == "q":
            self.exit()
        elif event.key == "c":
            # Open context screen
            context_screen = ContextScreen(self.library_path, self.repo)
            self.push_screen(context_screen)
