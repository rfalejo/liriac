"""Context screen view for managing chapter/persona selection and system prompt.

Implements the context management interface with book/chapter selection,
persona toggles, system prompt editing, and token estimation.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from textual import on
from textual.app import ComposeResult
from textual.containers import Horizontal, Vertical
from textual.message import Message
from textual.screen import Screen
from textual.widget import Widget
from textual.widgets import (
    Checkbox,
    Footer,
    Header,
    Label,
    ListItem,
    ListView,
    Static,
    TextArea,
)

from ....domain.types import ContextProfile
from ....services.context import SelectionState, build_context

if TYPE_CHECKING:
    from ....domain.ports import LibraryRepository
    from ....domain.types import BookId
    from ....domain.value_objects import ChapterRef


class BookListItem(ListItem):
    """Custom ListItem that can store a book ID."""

    def __init__(
        self,
        *children: Widget,
        book_id: BookId | None = None,
        name: str | None = None,
        id: str | None = None,
        classes: str | None = None,
        disabled: bool = False,
    ) -> None:
        super().__init__(
            *children,
            name=name,
            id=id,
            classes=classes,
            disabled=disabled,
        )
        self.book_id = book_id


class ChapterCheckboxItem(ListItem):
    """Custom ListItem with a checkbox for chapter selection."""

    def __init__(
        self,
        *children: Widget,
        chapter_ref: ChapterRef | None = None,
        name: str | None = None,
        id: str | None = None,
        classes: str | None = None,
        disabled: bool = False,
    ) -> None:
        super().__init__(
            *children,
            name=name,
            id=id,
            classes=classes,
            disabled=disabled,
        )
        self.chapter_ref = chapter_ref


class PersonaCheckboxItem(ListItem):
    """Custom ListItem with a checkbox for persona selection."""

    def __init__(
        self,
        *children: Widget,
        persona_name: str | None = None,
        name: str | None = None,
        id: str | None = None,
        classes: str | None = None,
        disabled: bool = False,
    ) -> None:
        super().__init__(
            *children,
            name=name,
            id=id,
            classes=classes,
            disabled=disabled,
        )
        self.persona_name = persona_name


class ContextCommitted(Message):
    """Message emitted when context selection is committed."""

    def __init__(self, profile: ContextProfile) -> None:
        super().__init__()
        self.profile = profile


class ContextScreen(Screen[None]):
    """Context management screen for chapter/persona selection and system prompt.

    Provides a full-screen interface for:
    - Book selection and chapter listing with toggles
    - Persona selection (when available)
    - System prompt editing
    - Commit/cancel actions
    """

    BINDINGS = [
        ("tab", "next_tab", "Next panel"),
        ("shift+tab", "prev_tab", "Previous panel"),
        ("space", "toggle_item", "Toggle selection"),
        ("s,ctrl+s", "commit", "Commit context"),
        ("escape", "app.pop_screen", "Cancel"),
    ]

    def __init__(
        self,
        library_path: Path,
        repo: LibraryRepository,
        system_prompt: str = "",
    ) -> None:
        """Initialize the context screen.

        Args:
            library_path: Path to the library directory
            repo: Repository for reading library and chapter data (must implement both protocols)
            system_prompt: Initial system prompt text
        """
        super().__init__()
        self.library_path = library_path
        self.repo = repo  # Assumes repo implements both LibraryRepository and ChapterRepository
        self.selection_state = SelectionState()
        self.initial_system_prompt = system_prompt
        self.current_book_id: BookId | None = None

    def compose(self) -> ComposeResult:
        """Compose the UI layout."""
        yield Header()
        yield Horizontal(
            Vertical(
                Static("Books", classes="panel-title"),
                ListView(id="books-list"),
                classes="panel",
                id="books-panel",
            ),
            Vertical(
                Static("Chapters", classes="panel-title"),
                ListView(id="chapters-list"),
                classes="panel",
                id="chapters-panel",
            ),
            Vertical(
                Static("Personas", classes="panel-title"),
                ListView(id="personas-list"),
                Static("No personas found", id="no-personas-msg"),
                classes="panel",
                id="personas-panel",
            ),
            id="main-content",
        )
        yield Vertical(
            Label("System Prompt:"),
            TextArea(
                self.initial_system_prompt,
                id="system-prompt",
                show_line_numbers=False,
            ),
            classes="prompt-panel",
            id="prompt-section",
        )
        yield Footer()

    async def on_mount(self) -> None:
        """Initialize the screen after mounting."""
        # Use call_after_refresh to ensure widgets are ready
        self.call_after_refresh(self._load_books)
        self.call_after_refresh(self._focus_books_list)

    def _load_books(self) -> None:
        """Load and populate the books list."""
        books_list = self.query_one("#books-list", ListView)

        try:
            book_ids = self.repo.list_books(self.library_path)
            for book_id in book_ids:
                books_list.append(BookListItem(Label(book_id), book_id=book_id))
        except (FileNotFoundError, OSError) as e:
            books_list.append(ListItem(Label(f"Error loading books: {e}")))

    def _focus_books_list(self) -> None:
        """Set focus to the books list."""
        books_list = self.query_one("#books-list", ListView)
        books_list.focus()

    @on(ListView.Selected, "#books-list")
    def on_book_selected(self, event: ListView.Selected) -> None:
        """Handle book selection and load chapters."""
        if event.item and isinstance(event.item, BookListItem) and event.item.book_id:
            self.current_book_id = event.item.book_id
            self._load_chapters(self.current_book_id)

    def _load_chapters(self, book_id: BookId) -> None:
        """Load and populate chapters for the selected book."""
        chapters_list = self.query_one("#chapters-list", ListView)
        chapters_list.clear()

        try:
            book = self.repo.load_book(self.library_path, book_id)
            for chapter_ref in book.chapters:
                checkbox = Checkbox(chapter_ref.relative_path.name, value=False)
                item = ChapterCheckboxItem(checkbox, chapter_ref=chapter_ref)
                chapters_list.append(item)
        except (FileNotFoundError, ValueError, OSError) as e:
            chapters_list.append(ListItem(Label(f"Error loading chapters: {e}")))

    def action_next_tab(self) -> None:
        """Move focus to the next panel."""
        focused = self.focused
        if focused is None:
            self._focus_books_list()
            return

        focused_id = getattr(focused, "id", None)
        if focused_id == "books-list":
            self.query_one("#chapters-list", ListView).focus()
        elif focused_id == "chapters-list":
            self.query_one("#personas-list", ListView).focus()
        elif focused_id == "personas-list":
            self.query_one("#system-prompt", TextArea).focus()
        else:
            self._focus_books_list()

    def action_prev_tab(self) -> None:
        """Move focus to the previous panel."""
        focused = self.focused
        if focused is None:
            self._focus_books_list()
            return

        focused_id = getattr(focused, "id", None)
        if focused_id == "system-prompt":
            self.query_one("#personas-list", ListView).focus()
        elif focused_id == "personas-list":
            self.query_one("#chapters-list", ListView).focus()
        elif focused_id == "chapters-list":
            self._focus_books_list()
        else:
            self.query_one("#system-prompt", TextArea).focus()

    def action_toggle_item(self) -> None:
        """Toggle the selection of the currently highlighted item."""
        focused = self.focused
        if focused is None:
            return

        if focused.id == "chapters-list":
            chapters_list = self.query_one("#chapters-list", ListView)
            if chapters_list.highlighted_child:
                item = chapters_list.highlighted_child
                if isinstance(item, ChapterCheckboxItem) and item.chapter_ref:
                    checkbox = item.query_one(Checkbox)
                    checkbox.value = not checkbox.value
                    if checkbox.value:
                        self.selection_state.toggle_chapter(item.chapter_ref)
                    else:
                        self.selection_state.toggle_chapter(item.chapter_ref)

    def action_commit(self) -> None:
        """Commit the current context selection."""
        # Get current selections
        chapters, personas = self.selection_state.snapshot()

        # Get system prompt text
        system_prompt_area = self.query_one("#system-prompt", TextArea)
        system_prompt = system_prompt_area.text

        # Build context profile
        profile = build_context(
            chapters=chapters,
            personas=personas,
            system_prompt=system_prompt,
        )

        # Post message and return to previous screen
        self.post_message(ContextCommitted(profile))
        self.app.pop_screen()
