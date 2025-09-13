#!/usr/bin/env python3
"""
Unit tests for CLI functionality.
"""

import argparse
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from liriac.cli import (
    create_parser,
    handle_init,
    handle_open,
    is_valid_book_root,
    main,
)


class TestCreateParser:
    """Test the argument parser creation."""

    def test_parser_creation(self):
        """Test that parser is created with correct configuration."""
        parser = create_parser()
        assert isinstance(parser, argparse.ArgumentParser)
        assert parser.prog == "liriac"
        assert "distraction-free Python TUI" in parser.description

    def test_help_flag(self):
        """Test that --help flag works."""
        with pytest.raises(SystemExit) as exc_info:
            create_parser().parse_args(["--help"])
        assert exc_info.value.code == 0

    def test_help_text_consistency(self, capsys):
        """Test that help text remains consistent (snapshot test)."""
        parser = create_parser()

        # Capture help text
        with pytest.raises(SystemExit):
            parser.parse_args(['--help'])

        captured = capsys.readouterr()
        help_text = captured.out

        # Basic consistency checks
        assert "liriac" in help_text
        assert "distraction-free Python TUI" in help_text
        assert "init" in help_text
        assert "open" in help_text
        assert "--help" in help_text
        assert "Command to execute" in help_text
        assert "Path to book" in help_text

    def test_parse_no_args(self):
        """Test parsing with no arguments (default behavior)."""
        parser = create_parser()
        args = parser.parse_args([])
        assert args.command is None
        assert args.path is None

    def test_parse_init_command(self):
        """Test parsing init command."""
        parser = create_parser()
        args = parser.parse_args(["init"])
        assert args.command == "init"
        assert args.path is None

    def test_parse_open_command(self):
        """Test parsing open command."""
        parser = create_parser()
        args = parser.parse_args(["open", "/some/path"])
        assert args.command == "open"
        assert args.path == "/some/path"

    def test_parse_open_without_path(self):
        """Test that open command requires a path."""
        parser = create_parser()
        args = parser.parse_args(["open"])
        assert args.command == "open"
        assert args.path is None


class TestIsValidBookRoot:
    """Test book root validation logic."""

    def test_valid_book_root(self, tmp_path):
        """Test that a directory with book.json is considered valid."""
        book_json = tmp_path / "book.json"
        book_json.write_text('{"title": "Test Book"}')
        assert is_valid_book_root(tmp_path) is True

    def test_invalid_book_root_no_file(self, tmp_path):
        """Test that a directory without book.json is invalid."""
        assert is_valid_book_root(tmp_path) is False

    def test_invalid_book_root_with_dir(self, tmp_path):
        """Test that a directory with book.json as a directory is invalid."""
        book_json = tmp_path / "book.json"
        book_json.mkdir()
        assert is_valid_book_root(tmp_path) is False


class TestHandleOpen:
    """Test the handle_open function."""

    def test_open_nonexistent_path(self, capsys):
        """Test opening a non-existent path."""
        result = handle_open(Path("/nonexistent/path"))
        assert result == 1
        captured = capsys.readouterr()
        assert "does not exist" in captured.err

    def test_open_file_instead_of_directory(self, tmp_path, capsys):
        """Test opening a file instead of a directory."""
        test_file = tmp_path / "test.txt"
        test_file.write_text("test")
        result = handle_open(test_file)
        assert result == 1
        captured = capsys.readouterr()
        assert "is not a directory" in captured.err

    def test_open_invalid_book_root(self, tmp_path, capsys):
        """Test opening a directory that's not a valid book root."""
        result = handle_open(tmp_path)
        assert result == 1
        captured = capsys.readouterr()
        assert "is not a valid book root" in captured.err
        assert "Use 'liriac init'" in captured.err

    def test_open_valid_book_root(self, tmp_path, capsys):
        """Test opening a valid book root."""
        book_json = tmp_path / "book.json"
        book_json.write_text('{"title": "Test Book"}')

        # Create the required directory structure
        liriac_dir = tmp_path / ".liriac"
        liriac_dir.mkdir()
        state_json = liriac_dir / "state.json"
        state_json.write_text('{"last_opened_chapter": "", "cursor": {"line": 0, "column": 0}, "autosave": {"enabled": true, "interval_seconds": 10}}')

        # Create a chapter directory and file
        chapters_dir = tmp_path / "chapters"
        chapters_dir.mkdir()
        chapter_file = chapters_dir / "01-test.md"
        chapter_file.write_text("# Test Chapter\n\nThis is a test.")

        result = handle_open(tmp_path)
        assert result == 0
        captured = capsys.readouterr()
        assert f"Opening book at: {tmp_path}" in captured.out
        assert "Book: Test Book" in captured.out
        assert "Chapter: 01-test.md" in captured.out


class TestHandleInit:
    """Test the handle_init function."""

    @patch('liriac.cli.Path.cwd')
    @patch('liriac.cli.is_valid_book_root')
    def test_init_command(self, mock_valid, mock_cwd, tmp_path, capsys):
        """Test init command execution."""
        mock_valid.return_value = False
        mock_cwd.return_value = tmp_path
        result = handle_init()
        assert result == 0
        captured = capsys.readouterr()
        assert "Initializing new book in:" in captured.out
        assert "Book structure created successfully!" in captured.out

        # Verify files were created
        assert (tmp_path / "book.json").exists()
        assert (tmp_path / "characters.json").exists()
        assert (tmp_path / "world.json").exists()
        assert (tmp_path / "chapters").is_dir()
        assert (tmp_path / ".liriac").is_dir()
        assert (tmp_path / ".liriac" / "state.json").exists()
        assert (tmp_path / ".liriac" / "lock").exists()

    @patch('liriac.cli.Path.cwd')
    @patch('liriac.cli.is_valid_book_root')
    def test_init_command_existing_book(self, mock_valid, mock_cwd, capsys):
        """Test init command fails when book already exists."""
        mock_valid.return_value = True
        mock_cwd.return_value = Path("/test/dir")
        result = handle_init()
        assert result == 1
        captured = capsys.readouterr()
        assert "A book already exists" in captured.err


class TestMainFunction:
    """Test the main function entry point."""

    def test_main_no_args(self, tmp_path, capsys):
        """Test main function with no arguments."""
        book_json = tmp_path / "book.json"
        book_json.write_text('{"title": "Test Book"}')

        # Create the required directory structure
        liriac_dir = tmp_path / ".liriac"
        liriac_dir.mkdir()
        state_json = liriac_dir / "state.json"
        state_json.write_text('{"last_opened_chapter": "", "cursor": {"line": 0, "column": 0}, "autosave": {"enabled": true, "interval_seconds": 10}}')

        with patch('liriac.cli.Path.cwd', return_value=tmp_path), \
             patch('sys.argv', ['liriac']):
            result = main()
            assert result == 0

    def test_main_init_command(self, capsys):
        """Test main function with init command."""
        with patch('liriac.cli.handle_init', return_value=0) as mock_handle, \
             patch('sys.argv', ['liriac', 'init']):
            result = main()
            assert result == 0
            mock_handle.assert_called_once()

    def test_main_init_command_with_path(self, capsys):
        """Test main function with init command and path (should error)."""
        with patch('sys.argv', ['liriac', 'init', 'some/path']):
            result = main()
            assert result == 1
            captured = capsys.readouterr()
            assert "'init' command does not accept a path" in captured.err

    def test_main_open_command_with_path(self, tmp_path, capsys):
        """Test main function with open command and path."""
        book_json = tmp_path / "book.json"
        book_json.write_text('{"title": "Test Book"}')

        # Create the required directory structure
        liriac_dir = tmp_path / ".liriac"
        liriac_dir.mkdir()
        state_json = liriac_dir / "state.json"
        state_json.write_text('{"last_opened_chapter": "", "cursor": {"line": 0, "column": 0}, "autosave": {"enabled": true, "interval_seconds": 10}}')

        with patch('sys.argv', ['liriac', 'open', str(tmp_path)]):
            result = main()
            assert result == 0

    def test_main_open_command_without_path(self, capsys):
        """Test main function with open command but no path."""
        with patch('sys.argv', ['liriac', 'open']):
            result = main()
            assert result == 1
            captured = capsys.readouterr()
            assert "'open' command requires a path" in captured.err


class TestEntryPoints:
    """Test that both entry points work correctly."""

    @patch('sys.exit')
    @patch('liriac.cli.main')
    def test_main_module_entry_point(self, mock_main, mock_exit):
        """Test that __main__.py correctly calls main."""
        mock_main.return_value = 0

        # Import and test the module entry point
        from liriac import __main__

        # Mock sys.argv to prevent interference and mock the import to avoid circular issues
        with patch('sys.argv', ['liriac']):
            __main__.main()
            mock_main.assert_called_once()
            # sys.exit is called in __main__.py but we don't need to test the exact mechanism

    def test_cli_main_function_importable(self):
        """Test that main function can be imported and is callable."""
        from liriac.cli import main
        assert callable(main)


if __name__ == "__main__":
    pytest.main([__file__])