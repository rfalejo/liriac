"""Home screen view for browsing books and chapters.

Implements the main library browsing interface with book and chapter lists.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from textual import on
from textual.app import ComposeResult
from textual.message import Message
from textual.screen import Screen
from textual.widget import Widget
from textual.widgets import ListItem, ListView, Static

from ....infra import load_ui_state

if TYPE_CHECKING:
    from ....domain.ports import LibraryRepository
    from ....domain.types import BookId
    from ....domain.value_objects import ChapterRef


class ChapterListItem(ListItem):
    """Custom ListItem that can store a chapter reference."""

    def __init__(
        self,
        *children: Widget,
        chapter_ref: ChapterRef | None = None,
        name: str | None = None,
        id: str | None = None,
        classes: str | None = None,
        disabled: bool = False,
        markup: bool = True,
    ) -> None:
        super().__init__(
            *children,
            name=name,
            id=id,
            classes=classes,
            disabled=disabled,
            markup=markup,
        )
        self.chapter_ref = chapter_ref


class ChapterChosen(Message):
    """Message emitted when a chapter is selected for editing."""

    def __init__(self, book_id: BookId, ref: ChapterRef) -> None:
        """Initialize the message with book and chapter references.

        Args:
            book_id: ID of the selected book
            ref: Reference to the selected chapter
        """
        super().__init__()
        self.book_id = book_id
        self.ref = ref


class HomeScreen(Screen[None]):
    """Home screen for browsing books and selecting chapters.

    Provides a two-pane interface with books on the left and chapters on the right.
    Allows navigation with keyboard and emits ChapterChosen messages when a chapter
    is selected.
    """

    BINDINGS = [
        ("tab", "switch_focus", "Switch Focus"),
    ]

    def __init__(self, library_path: Path, repo: LibraryRepository) -> None:
        """Initialize the home screen.

        Args:
            library_path: Path to the library directory
            repo: Repository for loading books and chapters
        """
        super().__init__()
        self.library_path = library_path
        self.repo = repo
        self._current_book_id: BookId | None = None
        self._book_ids: tuple[BookId, ...] = ()

    def compose(self) -> ComposeResult:
        """Create the UI composition."""
        yield Static("Books", classes="section-title", id="books-title")
        yield ListView(id="books-list")
        yield Static("Chapters", classes="section-title", id="chapters-title")
        yield ListView(id="chapters-list")
        yield Static(
            "Tab: Switch Focus | Enter: Select Chapter | q: Quit",
            classes="footer",
            id="status-footer",
        )

    def on_mount(self) -> None:
        """Initialize the screen when mounted."""
        self._load_books()

    def _load_books(self) -> None:
        """Load and display the list of books."""
        books_list = self.query_one("#books-list", ListView)
        chapters_list = self.query_one("#chapters-list", ListView)

        try:
            self._book_ids = self.repo.list_books(self.library_path)

            if not self._book_ids:
                books_list.extend(
                    [ListItem(Static("No books found in library"), disabled=True)]
                )
                chapters_list.extend(
                    [ListItem(Static("Select a book to view chapters"), disabled=True)]
                )
            else:
                for book_id in self._book_ids:
                    books_list.append(ListItem(Static(book_id)))

                # Focus the books list initially
                books_list.focus()

        except OSError as e:
            books_list.extend(
                [ListItem(Static(f"Error loading library: {e}"), disabled=True)]
            )
            chapters_list.extend(
                [ListItem(Static("Unable to load chapters"), disabled=True)]
            )

    def _load_chapters(self, book_id: BookId) -> None:
        """Load and display chapters for the selected book.

        Args:
            book_id: ID of the book to load chapters for
        """
        chapters_list = self.query_one("#chapters-list", ListView)
        chapters_list.clear()

        try:
            book = self.repo.load_book(self.library_path, book_id)
            self._current_book_id = book_id

            if not book.chapters:
                chapters_list.append(
                    ListItem(Static("No chapters in this book"), disabled=True)
                )
            else:
                # Load UI state to know which chapter to pre-select (if any)
                state = load_ui_state(self.library_path, book_id)
                last_opened = state.last_opened

                target_index: int | None = None

                for idx, chapter_ref in enumerate(book.chapters):
                    # Use the chapter filename as display text
                    display_name = chapter_ref.relative_path.name
                    item = ChapterListItem(
                        Static(display_name), chapter_ref=chapter_ref
                    )
                    chapters_list.append(item)
                    # Determine index to pre-select
                    if (
                        last_opened is not None
                        and chapter_ref.relative_path.as_posix() == last_opened
                    ):
                        target_index = idx

                # If a matching chapter found, highlight/select it
                if target_index is not None and 0 <= target_index < len(chapters_list.children):
                    try:
                        chapters_list.index = target_index
                    except Exception:
                        # Non-fatal; ignore if ListView API changes
                        pass

        except (FileNotFoundError, ValueError) as e:
            chapters_list.append(
                ListItem(Static(f"Error loading book: {e}"), disabled=True)
            )

    @on(ListView.Highlighted)
    def on_list_highlighted(self, event: ListView.Highlighted) -> None:
        """Handle item highlighting in lists."""
        if event.list_view.id == "books-list" and event.item is not None:
            # Get the book ID from the highlighted item index
            books_list = self.query_one("#books-list", ListView)
            if books_list.index is not None and books_list.index < len(self._book_ids):
                book_id = self._book_ids[books_list.index]
                self._load_chapters(book_id)

    @on(ListView.Selected)
    def on_list_selected(self, event: ListView.Selected) -> None:
        """Handle item selection in lists."""
        if event.list_view.id == "chapters-list":
            item = event.item

            # Check if this is a valid chapter item (custom ChapterListItem)
            if (
                isinstance(item, ChapterListItem)
                and item.chapter_ref is not None
                and self._current_book_id is not None
            ):
                self.post_message(
                    ChapterChosen(book_id=self._current_book_id, ref=item.chapter_ref)
                )

    def action_switch_focus(self) -> None:
        """Switch focus between books and chapters lists."""
        books_list = self.query_one("#books-list", ListView)
        chapters_list = self.query_one("#chapters-list", ListView)

        if books_list.has_focus:
            chapters_list.focus()
        else:
            books_list.focus()

    CSS = """
    Screen {
        layout: grid;
        grid-size: 2 3;
        grid-gutter: 1;
        padding: 1;
    }

    #books-title {
        dock: top;
        height: 1;
        text-align: center;
        text-style: bold;
        color: $primary;
        column-span: 1;
        row-span: 1;
    }

    #books-list {
        column-span: 1;
        row-span: 1;
        border: solid $primary;
    }

    #chapters-title {
        dock: top;
        height: 1;
        text-align: center;
        text-style: bold;
        color: $primary;
        column-span: 1;
        row-span: 1;
    }

    #chapters-list {
        column-span: 1;
        row-span: 1;
        border: solid $secondary;
    }

    #status-footer {
        column-span: 2;
        row-span: 1;
        dock: bottom;
        height: 1;
        text-align: center;
        color: $text-muted;
        background: $surface-lighten-1;
    }

    ListView:focus {
        border: solid $accent;
    }

    ListItem {
        padding: 0 1;
    }

    ListItem:hover {
        background: $surface-lighten-1;
    }

    ListItem.-highlighted {
        background: $accent;
        color: $text;
    }
    """
