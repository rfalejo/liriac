# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**liriac** is a distraction-free Python TUI for writing long-form books. Each book lives in its own folder with JSON metadata and Markdown chapters (no front matter). The main view is the current chapter. Users type and move the cursor with basic keys. Autosave writes changes on a timer. Characters and world-building are reference screens only.

## Running the Application

### Prerequisites
- Linux OS
- Python 3.11 (hard requirement)
- Optional: `uv` for faster dependency management

### Common Commands

```bash
# Run the application (opens current directory as a book)
./run

# Initialize a new book in current directory
./run init

# Open a book at specific path
./run open <path>

# Using uv directly (if available)
uv run liriac

# Using python module
python -m liriac

# Run tests (when implemented)
./run test
```

## Architecture Overview

### Core Components
- **CLI Entry**: `liriac/cli.py` - Main entry point with argument parsing
- **Package Structure**: `liriac/` - Main package with modules
- **Documentation**: `docs/` - Technical specs, epics, and tickets

### Technical Stack
- **Language**: Python 3.11
- **TUI Framework**: `prompt_toolkit` (full-screen app)
- **Dependency Management**: `uv` (primary) with `pip` fallback
- **Project Configuration**: `pyproject.toml` and `requirements.txt`

### Key Design Principles
- **Zero-step installation**: Clone and run
- **Single app lock**: Prevents multiple instances via `.liriac/lock`
- **Atomic writes**: Temporary files + rename for data integrity
- **Filesystem-based**: Human-readable JSON and Markdown files

## Development Workflow

### Project Structure
```
<BOOK_ROOT>/
    book.json              # Book metadata
    characters.json        # Characters database
    world.json             # World-building database
    chapters/              # Markdown chapters
    .liriac/
      state.json         # Last chapter, cursor, autosave config
      lock              # Single app-level lock file
```

### Chapter Naming Convention
- Pattern: `<NN>-<kebab>` (e.g., `01-el-encuentro.md`)
- `NN`: Zero-padded integer (minimum 2 digits)
- `<kebab>`: Lowercase alphanumeric with hyphens `[a-z0-9-]+`

### Global Key Bindings
- `Ctrl+S`: Save
- `Ctrl+Q`: Quit (confirm if unsaved changes)
- `Alt+A`: Toggle autosave
- `Ctrl+K`: Characters reference
- `Ctrl+W`: World-building reference

## Important Notes

- **Python version is strictly 3.11** - enforced by the run script
- **Linux only** - no cross-platform support planned
- **UTF-8 encoding** throughout
- **No cloud sync, real-time collaboration, or search functionality** (by design)
- **Minimal dependencies** - only `prompt_toolkit` is required