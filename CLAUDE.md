# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

liriac is a Python CLI/TUI for writing novel/long-form fiction with AI assistance. It's designed to be offline-first with file-based storage, fast iteration, and reproducible prompt assembly. The system uses AI to append content to chapters while allowing manual edits anywhere in the text.

## Architecture

### Core Design Principles
- **CLI-first** (Click-based) with optional Textual TUI
- **File-based storage** under `books/<slug>/` directory
- **Append-only AI generation** - AI can only add to the end of chapters
- **Configurable context system** for AI prompts with token budgeting
- **Provider-agnostic AI client** (OpenAI-only in v0.1, pluggable later)

### Domain Model
The project uses a clean domain-driven design with:
- **Aggregates**: Book, Chapter (Characters and World are standalone concepts)
- **Entities**: Simple dataclasses with light validation
- **Value Objects**: `BookId`, `ChapterId`, `Slug`, `Title`, `TokenCount`, etc.
- **Services**: `ContextBuilder` for prompt assembly
- **Error Handling**: Custom `DomainError` hierarchy

### File Structure
```
books/
  <slug>/
    metadata.json          # Book metadata and configuration
    characters.json        # Character database
    world_info.json        # World building info (locations, factions, rules, timeline)
    chapters/
      ch_01.md            # Chapter content (markdown)
      ch_01.json          # Chapter metadata and context config
    history/
      ch_01/
        yyyymmdd-hhmmss.md  # Historical snapshots
```

## Development Commands

### Core Commands (from Makefile)
```bash
make test          # Run tests with coverage
make lint          # Run Ruff lint checks
make format        # Format code with Ruff
make typecheck     # Run mypy type checks
make pyright       # Run pyright type checks
make fix           # Auto-fix linting and type issues
make clean         # Remove cache artifacts
```

### Manual Commands
```bash
pytest --cov=liaric --cov-report=term-missing  # Run tests with coverage
python -m ruff check .                         # Lint code
python -m ruff format .                         # Format code
mypy liaric                                    # Type check with mypy
pyright                                       # Type check with pyright
```

## Key Dependencies

### Runtime
- `textual>=6.1.0` - TUI framework
- `pydantic>=2.11.7` - Data validation
- `pyyaml>=6.0.2` - YAML parsing

### Development
- `pytest>=8.4.2` - Testing framework
- `pytest-asyncio>=1.1.0` - Async testing support
- `pytest-cov>=7.0.0` - Coverage reporting
- `ruff>=0.13.0` - Linter and formatter
- `mypy>=1.18.1` - Type checker
- `pyright>=1.1.405` - Type checker
- `bandit>=1.8.6` - Security linter

## Domain Concepts

### Context System
The AI context is assembled from:
1. Chapter synopsis/beats (highest priority)
2. Selected characters
3. Selected world sections
4. Previous chapter summaries
5. Full previous text (until token budget)

### Chapter Operations
- `append_text(delta, stop_policy)` - AI appends text only
- `apply_user_edit(full_text)` - Manual edits can replace entire chapter
- Strict append-only enforcement for AI generation

### Error Hierarchy
- `DomainError` - Base exception
- `InvariantViolation` - Entity/VO invariant violations
- `AppendRejected` - Non-append modification attempts
- `SlugInvalid` - Invalid slug format
- `ContextOverBudget` - Token budget exceeded

## Testing Strategy

- **Unit tests** for domain logic and validation
- **Golden tests** for prompt assembly snapshots
- **Integration tests** for context building and token counting
- **TUI smoke tests** for key interactions
- Use fixtures in `tests/factories.py` for test data

## Key Files to Understand

- `docs/0-design.md` - Comprehensive design document with wireframes
- `docs/01-domain.md` - Domain modeling decisions and implementation guidance
- `Makefile` - Development commands and tooling
- `requirements.txt` / `requirements-dev.txt` - Dependencies

## Important Notes

- The project follows a "minimal viable product" approach initially
- Domain code stays simple and provider-agnostic
- No domain events or complex versioning in MVP
- Token counting happens in adapter layer, not domain
- File storage is simple JSON/MD with history snapshots
- All context configuration is manual (no auto-trimming)

## Implementation Status

The project is in early development with:
- Comprehensive design documentation
- Domain modeling decisions finalized
- Development tooling configured
- Implementation tickets defined (see docs/tickets/)
- Core architecture established but minimal code exists yet