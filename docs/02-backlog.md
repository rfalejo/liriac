# Liriac — Product Backlog (MVP)

## Status
- Overall: Planned
- Last updated: 2025-09-13
- Scope: MVP
- Source docs: `docs/00-draft.md`, `docs/01-technical-spec.md`

## Epics
- Core Project & Tooling
- CLI & App Bootstrap
- Domain Model
- Filesystem Repository
- Configuration
- Logging & Metrics
- TUI Home
- TUI Editor
- Autosave
- AI Streaming Provider
- Suggestions Service
- Context Management
- Testing & QA

## Backlog Items (High-level)
- BL-001: Scaffold project with uv and `pyproject.toml`; add ruff/black/mypy (strongly typed)
- BL-002: CLI `liriac` with `--path`; boot TUI (Textual).
- BL-003: Domain entities (`Book`, `Chapter`, `Persona`, `Suggestion`, `ContextProfile`).
- BL-004: Filesystem repo: read/write `book.toml`, chapters, `.liriac/*` structure.
- BL-005: Configuration via env and `~/.config/liriac/config.toml` (Pydantic).
- BL-006: Structured logging (JSON) and local metrics file.
- BL-007: TUI Home screen: list/select books and chapters.
- BL-008: TUI Editor: render text, cursor, scroll, manual save.
- BL-009: Autosave service: debounce 10s, idempotent hash, atomic writes, snapshots threshold.
- BL-010: AI provider (OpenAI-compatible) via httpx streaming; timeout, retry, cancelation.
- BL-011: Suggestions service: prompt, live deltas, accept/regenerate/cancel; suggestions log.
- BL-012: Context management: personas and chapters toggles; token estimation.
- BL-013: UI state persistence: `.liriac/state.json` (last opened).
- BL-014: Tests: domain/services unit tests, httpx/respx integration, Textual Pilot basics.

## Milestones & Order
- M1: Core + CLI + Domain (BL-001–003)
- M2: FS Repo + Config + Logging (BL-004–006)
- M3: TUI Home + Editor (BL-007–008)
- M4: Autosave (BL-009)
- M5: AI Streaming + Suggestions (BL-010–011)
- M6: Context + Metrics/Polishing (BL-012–013)
- M7: Tests & Hardening (BL-014)

## Out of Scope (MVP)
- Export (EPUB/PDF/HTML)
- Undo/Redo
- Windows/macOS support
- Offline/local AI

## Risks & Mitigations
- Tokenization accuracy → start heuristic, add `tiktoken` later.
- FS concurrency on host → file lock per host, no multi-process editing.
- Performance on long chapters → async streaming, test with large files.

## Notes
- Keep items concise; create a dedicated doc per backlog ticket as needed.
