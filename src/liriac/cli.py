"""CLI entry point for Liriac."""

import sys
from pathlib import Path

import typer
from rich.console import Console

from .app import LiriacApp

app = typer.Typer(
    name="liriac",
    help="Linux TUI application for writing books with streaming AI assistance",
    add_completion=False,
)

console = Console()


def validate_path(path: Path) -> Path:
    """Validate that the provided path exists and is a directory."""
    if not path.exists():
        console.print(f"[red]Error: Path '{path}' does not exist.[/red]")
        sys.exit(1)

    if not path.is_dir():
        console.print(f"[red]Error: Path '{path}' is not a directory.[/red]")
        sys.exit(1)

    return path


@app.command()
def main(
    path: Path = typer.Option(
        lambda: Path.cwd(),
        "--path",
        "-p",
        help="Library/workspace directory path",
        resolve_path=True,
    ),
) -> None:
    """Launch Liriac TUI application."""
    validated_path = validate_path(path)

    # Launch the TUI app
    textual_app = LiriacApp(library_path=validated_path)
    textual_app.run()


if __name__ == "__main__":
    app()
