#!/usr/bin/env python3
"""
liriac CLI entry point.

A distraction-free Python TUI for writing long-form books.
"""

import sys


def main() -> int:
    """Main CLI entry point."""
    print("liriac - A distraction-free Python TUI for writing long-form books")
    print("")
    print("Usage:")
    print("  liriac           Open current directory as a book")
    print("  liriac init      Initialize a new book in current directory")
    print("  liriac open <path>  Open a book at the given path")
    print("")
    print("This is a minimal implementation for bootstrap testing.")
    return 0


if __name__ == "__main__":
    sys.exit(main())