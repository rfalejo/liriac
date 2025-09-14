# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Liriac** is a Linux TUI application for writing books with streaming AI assistance. It's a Python project that follows clean architecture principles with strict typing, domain-driven design, and async-first development.

## Development Commands

### Environment Setup
```bash
make venv          # Create virtual environment with uv
make sync          # Install dependencies with dev extras
make upgrade       # Upgrade dependencies
```

### Code Quality
```bash
make fmt           # Format code (ruff fix + black)
make lint          # Lint code (ruff check + black --check)
make typecheck     # Type check with mypy --strict
make test          # Run tests with pytest
make cov           # Run tests with coverage
make check         # Full CI pipeline (lint + typecheck + test)
```

### Building & Running
```bash
make run ARGS="--path ."  # Run the CLI
make build          # Build wheel/sdist with uv
make clean          # Clean build artifacts and caches
```

## Architecture

**Design Principles:**
- **Strict typing**: `mypy --strict` required, no implicit `Any`
- **Clean architecture**: Domain → Services → Infra → TUI layers
- **Async-first**: Non-blocking AI streaming and autosave
- **Resilient**: Idempotent autosave, crash recovery
- **Extensible**: Swappable AI providers via typed protocols

**Layer Structure:**
```
src/liriac/
├── domain/        # Pure entities and rules (no IO)
├── services/      # Use cases and orchestration
├── infra/         # Adapters (AI, FS, config, logging)
├── tui/           # Presentation (Textual)
└── utils/         # Utilities (timers, path, tokens)
```

**Key Ports/Protocols:**
- `AIProvider`: Async streaming interface for AI providers
- `Repository`: Filesystem abstraction for books/chapters
- `ConfigAdapter`: Type-safe configuration management

## Code Conventions

### Types & Patterns
- Use `NewType` for IDs, `Literal` for flags, `TypedDict` for data objects
- Prefer `Mapping`/`Sequence`/`Iterable` over concrete types
- Use `Protocol` for pluggable interfaces
- No implicit `Any` - explicit typing required

### Async & IO
- All network/disk operations must be async
- Set timeouts for external calls
- Honor cancellation signals
- Never block the event loop

### File Operations
- Use `pathlib.Path` for all file operations
- Atomic writes via temp files + `os.replace`
- Content hashing to avoid redundant saves
- Per-host file locks for concurrency

### Configuration
- Precedence: CLI flags → env vars → config.toml → defaults
- Type-safe settings via Pydantic
- Secrets via environment variables only
- TOML format for config files

## Data Storage

**Book Structure:**
```
<book-slug>/
├── book.toml          # Book metadata
├── personas.yaml      # Character definitions
├── chapters/          # Chapter markdown files
└── .liriac/           # App-managed data
    ├── suggestions/   # AI suggestions log
    ├── versions/      # Version snapshots
    └── state.json     # UI state (non-critical)
```

**Content Format:**
- Markdown: Basic CommonMark only
- TOML for metadata (stdlib `tomllib` + `tomli-w`)
- UTF-8 with `\n` line endings

## Testing Strategy

- **Domain/Services**: Unit tests, no IO
- **Infrastructure**: Integration with `httpx` + `respx` for mocking
- **TUI**: Textual Pilot for widget interactions
- **Type Coverage**: ≥90%, `mypy --strict` as CI gate
- **No real network calls** in tests

## Dependencies

**Key Technologies:**
- `textual`: TUI framework (async, native testing)
- `typer`: CLI framework
- `httpx`: Async HTTP client with streaming
- `pydantic`: Type-safe configuration
- `uv`: Package/environment management

**Development Tools:**
- `mypy`: Strict type checking
- `ruff` + `black`: Code formatting and linting
- `pytest`: Testing framework
- `tiktoken`: Token estimation (optional)

## Current Status

**Project Phase**: Early planning (MVP)
**Milestone**: BL-001 (Project scaffolding - in progress)
**Next Steps**: Complete `pyproject.toml` setup and tooling pipeline

## Important Notes

- Linux-only application (no macOS/Windows support)
- OpenAI-compatible AI providers via HTTP API
- No offline/local AI mode planned
- Autosave with 10-second debounce and content hashing
- Streaming AI responses with cancellation support
- Strict focus on writer workflow without publishing features

**Security**: API keys via environment variables only, no user content uploads without consent, redacted logging.