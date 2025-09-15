"""Minimal TUI app for Liriac."""

from pathlib import Path

from textual.app import App
from textual.events import Key

from .infra.fs.library import FilesystemLibraryRepository
from .tui import ChapterChosen, HomeScreen


class LiriacApp(App[None]):
    """Minimal Liriac TUI application."""

    def __init__(self, library_path: Path) -> None:
        super().__init__()
        self.library_path = library_path
        self.repo = FilesystemLibraryRepository()
        self.last_selection: tuple[str, str] | None = None

    def on_mount(self) -> None:
        """Initialize the app by pushing the home screen."""
        home_screen = HomeScreen(self.library_path, self.repo)
        self.push_screen(home_screen)

    def on_chapter_chosen(self, message: ChapterChosen) -> None:
        """Handle chapter selection from the home screen.

        Args:
            message: ChapterChosen message with book and chapter info
        """
        # Store the last selection (for now, just log it)
        self.last_selection = (str(message.book_id), str(message.ref.relative_path))
        # TODO: Open editor in a future ticket
        self.log.info(
            f"Chapter selected: {message.book_id}/{message.ref.relative_path}"
        )

    def on_key(self, event: Key) -> None:
        """Handle key events."""
        if event.key == "q":
            self.exit()
