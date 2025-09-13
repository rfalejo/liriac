#!/usr/bin/env python3
"""
liriac CLI entry point.

A distraction-free Python TUI for writing long-form books.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Optional


def is_valid_book_root(path: Path) -> bool:
    """Check if a path is a valid book root by checking for book.json."""
    book_json = path / "book.json"
    return book_json.exists() and book_json.is_file()


def handle_open(path: Path) -> int:
    """Handle opening a book at the specified path."""
    if not path.exists():
        print(f"Error: Path '{path}' does not exist.", file=sys.stderr)
        return 1

    if not path.is_dir():
        print(f"Error: Path '{path}' is not a directory.", file=sys.stderr)
        return 1

    if not is_valid_book_root(path):
        print(f"Error: '{path}' is not a valid book root (missing book.json).", file=sys.stderr)
        print("Use 'liriac init' to initialize a new book structure.", file=sys.stderr)
        return 1

    print(f"Opening book at: {path}")

    try:
        # Load book metadata
        book_json = path / "book.json"
        with open(book_json, 'r', encoding='utf-8') as f:
            book_data = json.load(f)

        # Load state
        state_json = path / ".liriac" / "state.json"
        with open(state_json, 'r', encoding='utf-8') as f:
            state_data = json.load(f)

        # Find chapters
        chapters_dir = path / "chapters"
        if chapters_dir.exists():
            chapter_files = sorted(chapters_dir.glob("*.md"))
        else:
            chapter_files = []

        # Determine which chapter to open
        last_opened = state_data.get("last_opened_chapter", "")

        if last_opened and (chapters_dir / last_opened).exists():
            current_chapter = last_opened
        elif chapter_files:
            current_chapter = chapter_files[0].name
        else:
            print("No chapters found. Create a chapter file in the chapters/ directory.")
            return 0

        # Update state with current chapter
        state_data["last_opened_chapter"] = current_chapter
        state_data["updated_at"] = "2025-09-13T03:57:00Z"  # This would be current time in real implementation

        # Write updated state
        with open(state_json, 'w', encoding='utf-8') as f:
            json.dump(state_data, f, indent=2)

        # Display book and chapter info
        book_title = book_data.get("title", "Untitled Book")
        chapter_path = chapters_dir / current_chapter

        print(f"Book: {book_title}")
        print(f"Chapter: {current_chapter}")

        if chapter_path.exists():
            with open(chapter_path, 'r', encoding='utf-8') as f:
                content = f.read()
                line_count = len(content.split('\n'))
                word_count = len(content.split())
                print(f"Content: {line_count} lines, {word_count} words")
        else:
            print("Chapter file not found - will be created when edited")

        print(f"Cursor position: line {state_data.get('cursor', {}).get('line', 0)}, "
              f"column {state_data.get('cursor', {}).get('column', 0)}")
        print(f"Autosave: {'enabled' if state_data.get('autosave', {}).get('enabled', True) else 'disabled'} "
              f"({state_data.get('autosave', {}).get('interval_seconds', 10)}s)")

        return 0

    except Exception as e:
        print(f"Error opening book: {e}", file=sys.stderr)
        return 1


def handle_init() -> int:
    """Handle initializing a new book in the current directory."""
    current_dir = Path.cwd()

    # Check if book already exists
    if is_valid_book_root(current_dir):
        print(f"Error: A book already exists in '{current_dir}'.", file=sys.stderr)
        return 1

    print(f"Initializing new book in: {current_dir}")

    try:
        # Create book.json
        book_json = current_dir / "book.json"
        if book_json.exists():
            print(f"Error: '{book_json}' already exists.", file=sys.stderr)
            return 1

        book_data = {
            "title": "My Book",
            "author": "",
            "created_at": "2025-09-12T03:21:00Z",
            "updated_at": "2025-09-12T03:21:00Z",
            "description": "",
            "tags": []
        }
        book_json.write_text(json.dumps(book_data, indent=2))

        # Create characters.json
        characters_json = current_dir / "characters.json"
        if characters_json.exists():
            print(f"Error: '{characters_json}' already exists.", file=sys.stderr)
            return 1

        characters_data = {
            "characters": [],
            "next_id": 1
        }
        characters_json.write_text(json.dumps(characters_data, indent=2))

        # Create world.json
        world_json = current_dir / "world.json"
        if world_json.exists():
            print(f"Error: '{world_json}' already exists.", file=sys.stderr)
            return 1

        world_data = {
            "elements": [],
            "next_id": 1
        }
        world_json.write_text(json.dumps(world_data, indent=2))

        # Create chapters directory
        chapters_dir = current_dir / "chapters"
        if chapters_dir.exists():
            if not chapters_dir.is_dir():
                print(f"Error: '{chapters_dir}' exists but is not a directory.", file=sys.stderr)
                return 1
        else:
            chapters_dir.mkdir()

        # Create .liriac directory
        liriac_dir = current_dir / ".liriac"
        if liriac_dir.exists():
            if not liriac_dir.is_dir():
                print(f"Error: '{liriac_dir}' exists but is not a directory.", file=sys.stderr)
                return 1
        else:
            liriac_dir.mkdir()

        # Create state.json
        state_json = liriac_dir / "state.json"
        if state_json.exists():
            print(f"Error: '{state_json}' already exists.", file=sys.stderr)
            return 1

        state_data = {
            "last_opened_chapter": "",
            "cursor": {"line": 0, "column": 0},
            "autosave": {"enabled": True, "interval_seconds": 10}
        }
        state_json.write_text(json.dumps(state_data, indent=2))

        # Create lock file
        lock_file = liriac_dir / "lock"
        if lock_file.exists():
            print(f"Error: '{lock_file}' already exists.", file=sys.stderr)
            return 1

        lock_file.touch()

        print("Book structure created successfully!")
        return 0

    except Exception as e:
        print(f"Error creating book structure: {e}", file=sys.stderr)
        return 1


def create_parser() -> argparse.ArgumentParser:
    """Create and configure the argument parser."""
    parser = argparse.ArgumentParser(
        prog="liriac",
        description="A distraction-free Python TUI for writing long-form books",
        epilog="For more information, visit: https://github.com/your-repo/liriac"
    )

    parser.add_argument(
        "command",
        nargs="?",
        choices=["init", "open"],
        help="Command to execute"
    )

    parser.add_argument(
        "path",
        nargs="?",
        help="Path to book (for 'open' command)"
    )

    return parser


def main() -> int:
    """Main CLI entry point."""
    parser = create_parser()
    args = parser.parse_args()

    # Handle default behavior (no arguments)
    if args.command is None:
        return handle_open(Path.cwd())

    # Handle explicit commands
    if args.command == "init":
        if args.path:
            print("Error: 'init' command does not accept a path argument.", file=sys.stderr)
            return 1
        return handle_init()

    elif args.command == "open":
        if args.path is None:
            print("Error: 'open' command requires a path argument.", file=sys.stderr)
            return 1

        path = Path(args.path)
        return handle_open(path)

    else:
        # This should not be reached due to argparse choices
        print(f"Error: Unknown command '{args.command}'", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())