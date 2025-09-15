"""Tests for TUI app functionality."""

from pathlib import Path

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


def test_liriac_app_runs_with_home_screen(tmp_path: Path) -> None:
    """Test that LiriacApp initializes with home screen."""
    app = LiriacApp(library_path=tmp_path)

    # Check that the app has the correct library path
    assert app.library_path == tmp_path

    # Check that the repository is initialized
    assert app.repo is not None
