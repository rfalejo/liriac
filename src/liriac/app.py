"""Minimal TUI app for Liriac."""

from pathlib import Path

from textual.app import App, ComposeResult
from textual.events import Key
from textual.widgets import Static


class LiriacApp(App[None]):
    """Minimal Liriac TUI application."""

    def __init__(self, library_path: Path) -> None:
        super().__init__()
        self.library_path = library_path

    def compose(self) -> ComposeResult:
        """Create the initial UI composition."""
        yield Static(f"Liriac - Library Path: {self.library_path}", classes="title")
        yield Static("Press 'q' or Ctrl+C to exit", classes="instruction")

    def on_key(self, event: Key) -> None:
        """Handle key events."""
        if event.key == "q":
            self.exit()

    CSS_PATH = None

    CSS = """
    Screen {
        align: center middle;
        background: $surface;
    }

    .title {
        text-align: center;
        color: $primary;
        text-style: bold;
        margin-bottom: 1;
    }

    .instruction {
        text-align: center;
        color: $secondary;
        opacity: 0.7;
    }
    """
