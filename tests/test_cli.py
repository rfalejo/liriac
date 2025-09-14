"""Tests for CLI functionality."""

from pathlib import Path
from unittest.mock import patch

import pytest
from typer.testing import CliRunner

from liriac.cli import app


@pytest.fixture
def runner() -> CliRunner:
    """Create a CLI test runner."""
    return CliRunner()


def test_cli_help(runner: CliRunner) -> None:
    """Test that --help runs successfully."""
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "liriac" in result.stdout.lower()
    assert "--path" in result.stdout


def test_cli_valid_path(runner: CliRunner, tmp_path: Path) -> None:
    """Test that CLI runs successfully with a valid path."""
    with patch("liriac.cli.LiriacApp") as mock_app_class:
        mock_app = mock_app_class.return_value
        mock_app.run.return_value = None

        result = runner.invoke(app, ["--path", str(tmp_path)])
        assert result.exit_code == 0

        # Verify the app was created with the correct path
        mock_app_class.assert_called_once_with(library_path=tmp_path)
        mock_app.run.assert_called_once()


def test_cli_default_path(runner: CliRunner, tmp_path: Path) -> None:
    """Test that CLI uses current directory as default path."""
    with (
        patch("liriac.cli.LiriacApp") as mock_app_class,
        patch("pathlib.Path.cwd", return_value=tmp_path),
    ):

        mock_app = mock_app_class.return_value
        mock_app.run.return_value = None

        result = runner.invoke(app)
        assert result.exit_code == 0

        # Verify the app was created with current directory
        mock_app_class.assert_called_once_with(library_path=tmp_path)
        mock_app.run.assert_called_once()


def test_cli_invalid_nonexistent_path(runner: CliRunner) -> None:
    """Test that CLI fails with non-existent path."""
    nonexistent_path = "/nonexistent/directory"
    result = runner.invoke(app, ["--path", nonexistent_path])
    assert result.exit_code == 1
    assert "does not exist" in result.stdout


def test_cli_invalid_file_path(runner: CliRunner, tmp_path: Path) -> None:
    """Test that CLI fails when path is a file, not directory."""
    # Create a file
    test_file = tmp_path / "test.txt"
    test_file.write_text("test content")

    result = runner.invoke(app, ["--path", str(test_file)])
    assert result.exit_code == 1
    # Check that the error message contains the key phrase (normalize whitespace)
    normalized_output = " ".join(result.stdout.split())
    assert "not a directory" in normalized_output


def test_cli_path_resolution(runner: CliRunner, tmp_path: Path) -> None:
    """Test that relative paths are resolved to absolute paths."""
    # Create a subdirectory in the current working directory
    subdir = Path.cwd() / "test_subdir"
    subdir.mkdir(exist_ok=True)

    try:
        with patch("liriac.cli.LiriacApp") as mock_app_class:
            mock_app = mock_app_class.return_value
            mock_app.run.return_value = None

            # Test with relative path
            result = runner.invoke(app, ["--path", "test_subdir"])
            assert result.exit_code == 0

            # Verify the path was resolved to absolute
            call_args = mock_app_class.call_args
            assert call_args[1]["library_path"] == subdir
    finally:
        # Clean up
        subdir.rmdir()
