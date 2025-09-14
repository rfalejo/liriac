"""Tests for TUI app functionality."""

from pathlib import Path

from textual.widgets import Static

from liriac.app import LiriacApp


def test_liriac_app_import() -> None:
    """Test that LiriacApp can be imported successfully."""
    # This test ensures the module loads with strict typing
    # without starting the event loop
    assert LiriacApp is not None


def test_liriac_app_initialization(tmp_path: Path) -> None:
    """Test that LiriacApp can be initialized with a path."""
    app = LiriacApp(library_path=tmp_path)
    assert app.library_path == tmp_path


def test_liriac_app_compose_method(tmp_path: Path) -> None:
    """Test that LiriacApp compose method works."""
    app = LiriacApp(library_path=tmp_path)

    # Get the compose result without running the app
    compose_result = list(app.compose())

    # Should return two Static widgets
    assert len(compose_result) == 2
    assert all(isinstance(widget, Static) for widget in compose_result)
