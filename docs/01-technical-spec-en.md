# Technical Specification and Architecture — liriac

Goal: implement a Linux TUI application, written in Python and managed with uv, that allows writing books and chapters with streaming AI assistance, idempotent autosave, and context management (characters and chapters).

## Design Principles
- Strong typing first: strict types in Domain/Services/Infra/TUI; `mypy --strict` mandatory in CI, use of `typing_extensions` and contracts with `Protocol`, `TypedDict`, `Literal`, `NewType`.
- Simplicity first: storage in Markdown files + TOML/YAML metadata.
- Asynchrony: AI streaming and autosave do not block the UI.
- Modularity: separate Domain, Services, Infrastructure, and TUI.
- Extensibility: swappable AI providers via typed ports (Protocol).
- Resilience: idempotent autosave, crash recovery, never lose user text.

## Requirements
- OS: Linux (x86_64), ANSI-compatible terminal; no macOS/Windows support.
- Python: 3.11 or higher.
- Manager: `uv` for envs, installation, and execution.
- Network: HTTPS access to providers compatible with the OpenAI API; no offline/local mode.
- Storage: user’s filesystem (e.g., `~/Documents/liriac`).

## Project Structure (proposed)
```
liriac/
├─ pyproject.toml
├─ src/
│  └─ liriac/
│     ├─ __init__.py
│     ├─ cli.py                    # CLI entry point (Typer)
│     ├─ app.py                    # TUI bootstrap
│     ├─ constants.py
│     ├─ types.py                  # Strongly-typed shared types
│     ├─ errors.py
│     ├─ tui/                      # Presentation (Textual)
│     │  ├─ __init__.py
│     │  ├─ keymap.py
│     │  ├─ messages.py
│     │  ├─ styles/
│     │  │  └─ app.tcss
│     │  └─ screens/
│     │     ├─ home/
│     │     │  ├─ __init__.py
│     │     │  ├─ view.py
│     │     │  └─ controller.py
│     │     ├─ editor/
│     │     │  ├─ __init__.py
│     │     │  ├─ view.py
│     │     │  ├─ controller.py
│     │     │  └─ statusbar.py
│     │     ├─ suggest/
│     │     │  └─ view.py
│     │     └─ context/
│     │        └─ view.py
│     ├─ domain/                   # Entities and rules (no IO)
│     │  ├─ __init__.py
│     │  ├─ entities/
│     │  │  ├─ book.py
│     │  │  ├─ chapter.py
│     │  │  ├─ persona.py
│     │  │  ├─ suggestion.py
│     │  │  └─ context.py
│     │  ├─ value_objects.py
│     │  ├─ ports.py               # Protocols: AIProvider, Repo, Config
│     │  └─ events.py
│     ├─ services/                 # Orchestration/use cases
│     │  ├─ __init__.py
│     │  ├─ autosave/
│     │  │  ├─ scheduler.py
│     │  │  ├─ writer.py
│     │  │  └─ snapshots.py
│     │  ├─ suggestions/
│     │  │  ├─ orchestrator.py
│     │  │  ├─ history.py
│     │  │  └─ acceptance.py
│     │  └─ context/
│     │     ├─ builder.py
│     │     ├─ selectors.py
│     │     └─ limits.py
│     ├─ infra/                    # Adapters (implement ports)
│     │  ├─ __init__.py
│     │  ├─ fs/
│     │  │  ├─ library.py
│     │  │  ├─ books.py
│     │  │  ├─ chapters.py
│     │  │  ├─ state.py
│     │  │  ├─ versions.py
│     │  │  └─ locks.py
│     │  ├─ ai/
│     │  │  ├─ __init__.py
│     │  │  ├─ base.py             # Interfaces/Protocol
│     │  │  ├─ mock.py
│     │  │  └─ openai/
│     │  │     ├─ client.py
│     │  │     ├─ stream.py
│     │  │     ├─ mapper.py
│     │  │     └─ retry.py
│     │  ├─ config/
│     │  │  ├─ __init__.py
│     │  │  ├─ settings.py         # Pydantic (type-safe)
│     │  │  └─ sources.py
│     │  ├─ logging.py             # Structured logging
│     │  └─ metrics.py
│     └─ utils/
│        ├─ __init__.py
│        ├─ timers.py              # Debounce/Throttle
│        ├─ io.py
│        ├─ path.py
│        ├─ hashing.py
│        └─ tokens/
│           ├─ __init__.py
│           ├─ heuristics.py
│           └─ tiktoken_adapter.py
├─ docs/
│  ├─ 00-draft.md
│  └─ 01-technical-spec.md
└─ .env.example                    # Environment variables (tokens, etc.)
```

## Data Format and Storage
- Default library in the current directory (configurable).
- Supported Markdown format: basic CommonMark; no tables, footnotes, links, or other extensions; only basic styles.
- No size limits per chapter/book defined by the app.
- No backup/sync integration (Syncthing/Dropbox) in the app.
- Per-book structure:
  ```
  ./<book-slug>/
  ├─ book.toml                 # book metadata (title, author, dates, etc.)
  ├─ personas.yaml             # characters/entities of the world
  ├─ chapters/
  │  ├─ 01-la-salida.md
  │  ├─ 02-el-mapa.md
  │  └─ 03-el-puerto.md
  └─ .liriac/
     ├─ suggestions/
     │  ├─ 2025-09-13T12-00-00Z-01.md   # accepted/rejected suggestions (log)
     │  └─ ...
     ├─ versions/             # version log (snapshots/diffs); no undo/redo
     └─ state.json            # non-critical UI state (last opened chapter, etc.)
  ```
- `book.toml` (minimum example):
  ```toml
  title = "El viajero"
  created_at = "2024-09-01"
  chapters = ["01-la-salida.md", "02-el-mapa.md", "03-el-puerto.md"]
  last_opened = "03-el-puerto.md"
  ```
- Rejected suggestions are kept in `.liriac/suggestions/` for audit.
- A versions log is kept in `.liriac/versions/`; there is no undo/redo.

## Recommended Dependencies
- TUI:
  - Option A (recommended): `textual` (async, screen composition, testing with Pilot).
  - Alternatives: `prompt_toolkit` + `rich`, or `urwid`.
- CLI: `typer` for commands (`liriac`).
- HTTP/Streaming: `httpx` (async) with streaming support.
- Configuration: `pydantic` (settings) + `tomllib` (stdlib TOML reader) + `tomli-w` (writer).
- Tokenization (estimation): `tiktoken`.
- Tests: `pytest`, `pytest-asyncio`.
- Typing: `mypy` (strict; mandatory in CI), `typing-extensions`, stubs `types-*`, optional `pyright`.
- Style: `ruff` (linter) and `black` (formatter); rule to prevent unintentional `Any`.

## Startup and Packaging with uv
- `pyproject.toml`:
  - Define project `name = "liriac"`, `requires-python = ">=3.11"`.
  - `dependencies = [...]` as selected.
  - `[project.scripts] liriac = "liriac.cli:app"` (Typer).
- Useful commands (Linux + uv):
  ```
  uv venv
  uv sync --all-extras
  uv run liriac
  ```
- Distribution: `uv build` (wheel/sdist). Optional publishing.

## Logical Architecture (layers)
- UI (TUI): screens and widgets; contains no business logic.
- Application services: orchestrate use cases (suggest, accept, regenerate, autosave).
- Ports: typed interfaces with `Protocol`/`TypedDict` that define contracts without IO.
- Domain: pure entities and rules (no IO) with explicit invariants.
- Infrastructure: adapters (AI, FS, config, logging) that implement Ports.
- Contracts and types: IDs with `NewType`, flags with `Literal`, avoid implicit `Any`.
- Diagram (text):
  ```
  TUI ──> Services ──> Domain
    │         │
    │         └───> Ports (Protocol)
    └───────────────────────┐
                            v
                         Infra (AI/FS/Config/Log) ──> implements Ports
  ```

## Domain Modeling (summary)
- Entities:
  - `Book(id, title, created_at, chapters: list[ChapterRef], personas: list[Persona])`
  - `Chapter(id, title, path, text, updated_at)`
  - `Persona(id, name, role, notes, enabled: bool)`
  - `Suggestion(id, text, source, created_at, status: {pending, accepted, rejected})`
  - `ContextProfile(chapters: list[ChapterRef], personas: list[PersonaRef], system_prompt: str)`
- Rules:
  - AI only suggests at the end of the current chapter.
  - Accept merges and clears the differentiated color (presentation).
  - Idempotent autosave every 10s or upon accept; avoid writing if the content hash did not change.

## Main Flows
1. Open book/chapter:
   - FS repository lists books → select → load `book.toml` and active chapter → render TUI.
2. Generate suggestion:
   - Build `ContextProfile` → compose prompt → call `AIProvider.stream()` → render tokens in real time → control cancellation.
3. Accept suggestion:
   - Merge text into `Chapter.text` → persist with `AutosaveService` (idempotent) → log in `.liriac/suggestions/`.
4. Regenerate:
   - Keep an in-memory list of suggestions; navigation 1/2, 2/2.
5. Autosave:
   - Timer with `debounce(10s)` and `content_hash` to avoid redundant writes.

## AI Streaming
- Interface (Protocol):
  ```python
  class AIProvider(Protocol):
      async def stream(
          self, *, prompt: str, settings: AISettings, context: ContextProfile
      ) -> AsyncIterator[StreamEvent]: ...
  ```
- `StreamEvent`: `delta: str | None`, `usage: Tokens | None`, `done: bool`, `error: str | None`.
- OpenAI/compatibles:
  - `httpx.AsyncClient.stream("POST", url, json=payload, headers=...)`
  - Cancellation control: `async with anyio.move_on_after(timeout)` or TUI signal (Esc x2).
  - Default timeout: 120s; if there are deltas in progress, it does not expire until streaming finishes.
  - Upon reaching token limit: truncate with a subtle warning.
  - Single retry with short backoff on network errors.
  - Expose all parameters supported by OpenAI (temperature, top_p, etc.).
  - No budgeting or app-level backpressure; rate limit errors are reported as is.

## Autosave (detail)
- Dedicated service with:
  - `schedule_save(chapter_id, content)`: applies `debounce(10s)`.
  - Writes only if `sha256(content)` differs from the last save.
  - Snapshots in `.liriac/versions/` only if the diff is >= 100 characters.
  - Safe handling: write to a temp file and `os.replace` atomically.
  - Concurrency: file lock at host level (not distributed); no automatic merge.
  - Minimal state in `.liriac/state.json` (last opened; if lost, content is unaffected).

## Context Management
- Personas: boolean toggles per chapter.
- Included chapters: multi-select with token-based limits.
- Token estimation:
  - Base heuristic by length + `tiktoken` for accurate measurement later.
- System prompt per book in a Markdown file (not editable from the TUI); reloaded when sending the prompt.

## Logging and Metrics
- Structured logging (`json`) with levels: INFO by default, DEBUG optional.
- Redact secrets (API keys).
- Local metrics in `.liriac/metrics.json` (suggestion counts, timings), no external telemetry.
- No automatic rotation of logs/metrics; files can grow without limit.

## Testing
- Domain/Services: unit tests (no IO).
- Infra: integration tests with `httpx` + `respx` (mock).
- TUI: tests with `textual` Pilot (basic interactions, snapshot).
- Mock AIProvider for deterministic offline flows.
- Typing (CI): `mypy --strict` as gate; type coverage ≥ 90%; `type: ignore` only with justification.

## Accessibility and UX
- Consistent keyboard controls and visible footers.
- Persistence of last focus/panel.
- No customization of keyboard shortcuts.
- No alternative access paths to the Esc key.
- No themes/icons/emojis.
- Future i18n; currently UX in Spanish.

## Security and Privacy
- API keys only via environment variables or `~/.config/liriac/config.toml` with 600 permissions.
- Do not upload user content without explicit consent.
- No custom retention policy with OpenAI-compatible providers; defaults are used and no extra metadata is sent.
- Logs without sensitive data.

## Architecture Suggestions

### A) Textual + httpx + Typer (recommended) <-- We will use this.
- Pros: rich components, native async, integrated tests, modern layout.
- Cons: specific dependency; moderate learning curve.

## MVP Roadmap
1. Project structure + CLI (`liriac --path .`).
2. Home screen (books/chapters) with navigation and open chapter.
3. Basic editor with scroll/cursor, load/manual save.
4. Idempotent autosave service (10s) + atomic save.
5. Suggestion mode: prompt, streaming with cancellation, accept/regenerate.
6. Basic context management (personas and chapters).
7. Initial logging and configuration.
8. Strict typing in CI: `mypy --strict`, type coverage ≥ 90%, no implicit `Any`.

## Configuration
- Configuration precedence:
  1) CLI flags → 2) Environment variables → 3) `~/.config/liriac/config.toml` → 4) Defaults.
- Example `.env.example`:
  ```
  LIRIAC_LIBRARY_DIR=/home/usuario/Documents/liriac # If not set, current directory is used.
  LIRIAC_AI_PROVIDER=openai # only supported for now
  OPENAI_MODEL=gpt-5
  OPENAI_API_KEY=sk-*****
  OPENAI_BASE_URL= # optional, if the endpoint is not OpenAI
  OPENAI_MAX_TOKENS=512
  OPENAI_REQUEST_TIMEOUT=120
  ```