# liriac — Epics & Tickets (v0.3)

This plan incorporates clarifications:
- Autosave toggle persists to `state.json`.
- On open, fallback to the last valid autosave if it is newer than the last document edit.
- Lexicographic chapter selection is case‑sensitive and `.md` only.
- Characters/World schemas are limited to the fields shown in the spec.
- Lock failure exits with a clear message.

---

## LR-01 — Bootstrap Project Tooling

- ID: LR-01
- Name: Bootstrap Project Tooling
- Acceptance Criteria:
  - `pyproject.toml` pins Python `==3.11.*`, adds `prompt_toolkit>=3,<4`, sets `liriac = liriac.cli:main`.
  - `requirements.txt` lists `prompt_toolkit>=3,<4`.
  - `run` script enforces Python 3.11 and prefers `uv`, falling back to venv + pip.
  - `./run` executes a no‑op CLI that exits `0` and prints help.
- Testing Strategy:
  - Shell smoke tests for `./run`, `uv run liriac`, and `python -m liriac` in CI.

## LR-01A - Strong type hinting
- ID: LR-01A
- Name: Strong type hinting
- Acceptance Criteria:
  - Configure `mypy` in `pyproject.toml` with strict settings.
  - All code in `liriac/` is fully type-hinted and passes `mypy` checks.
- Testing Strategy:
  - CI step to run `mypy liriac/` and fail on any type errors.
  - Ensure new code is type-annotated as part of code reviews.

## LR-02 — CLI & Entry Points

- ID: LR-02
- Name: CLI & Entry Points
- Acceptance Criteria:
  - `python -m liriac` and `uv run liriac` both invoke `liriac.cli:main`.
  - Commands: `init`, `open <path>`, default opens current directory.
  - Helpful error if path is not a valid book root.
- Testing Strategy:
  - Unit tests for argument parsing and command dispatch; snapshot help text.

## LR-03 — Init Book Scaffold

- ID: LR-03
- Name: Init Book Scaffold
- Acceptance Criteria:
  - `liriac init` creates `book.json`, `characters.json`, `world.json`, `chapters/`, `.liriac/state.json` exactly as spec.
  - Does not overwrite existing files; errors clearly if structure exists.
  - Files are UTF‑8 and end with a single trailing `\n`.
- Testing Strategy:
  - Integration test in a temp dir asserting exact files and JSON schema.

## LR-04 — Slug Validator

- ID: LR-04
- Name: Slug Validator
- Acceptance Criteria:
  - Validator accepts `<NN>-<kebab>` where `NN` is zero‑padded int (min 2 digits) and `<kebab>` is `[a-z0-9-]+`.
  - Clear error messages for invalid slugs.
- Testing Strategy:
  - Table‑driven unit tests for valid/invalid cases and boundary values.

## LR-05 — Data Models

- ID: LR-05
- Name: Data Models
- Acceptance Criteria:
  - Dataclasses: `Book`, `Character`, `WorldElement`, `State` (with `last_opened_chapter`, `cursor`, `autosave`), plus simple `ChapterRef`.
  - JSON (de)serialization helpers that preserve specified fields only.
- Testing Strategy:
  - Round‑trip model → JSON → model unit tests per schema.

## LR-06 — JSON Repo I/O

- ID: LR-06
- Name: JSON Repo I/O
- Acceptance Criteria:
  - Load/save helpers for the JSON files using UTF‑8.
  - Writes are atomic: write to temp file then rename for JSON metadata too.
- Testing Strategy:
  - Unit tests simulate concurrent reads; verify atomicity and valid JSON on disk.

## LR-07 — Chapter Write (Atomic)

- ID: LR-07
- Name: Chapter Write (Atomic)
- Acceptance Criteria:
  - `write_chapter(path, text)` writes to `<file>.tmp` then atomic rename to `<file>`.
  - Normalize line endings to `\n` and ensure exactly one trailing `\n`.
- Testing Strategy:
  - Unit tests for normalization and atomic rename; verify no partial writes exist.

## LR-08 — State Management

- ID: LR-08
- Name: State Management
- Acceptance Criteria:
  - Read/write `.liriac/state.json` with `last_opened_chapter`, `cursor`, `autosave.enabled`, `autosave.interval_seconds`.
  - Autosave toggle updates `state.json` immediately.
- Testing Strategy:
  - Unit tests for persistence across updates; corrupt/missing file fallback to safe defaults.

## LR-09 — App Lock

- ID: LR-09
- Name: App Lock
- Acceptance Criteria:
  - Create `.liriac/lock` using O_EXCL on start; remove on clean exit.
  - If lock exists, exit with a clear, user‑friendly message.
- Testing Strategy:
  - Integration test: simulate second instance; assert exit code and message.

## LR-10 — Editor UI Shell

- ID: LR-10
- Name: Editor UI Shell
- Acceptance Criteria:
  - `prompt_toolkit` full‑screen app with title bar (book title · chapter filename · modified flag).
  - Text area with soft wrap; status bar (line/column, autosave status); lower‑left message area.
- Testing Strategy:
  - Unit test ensures an `Application` is created; snapshot layout structure.

## LR-11 — Keybindings

- ID: LR-11
- Name: Keybindings
- Acceptance Criteria:
  - `Ctrl+S` saves chapter; `Ctrl+Q` quits (confirm if dirty).
  - `Alt+A` toggles autosave and persists to `state.json` immediately.
  - `Ctrl+K` opens Characters; `Ctrl+W` opens World.
- Testing Strategy:
  - Simulate key events with `prompt_toolkit` test utilities; assert side effects.

## LR-12 — Autosave Timer

- ID: LR-12
- Name: Autosave Timer
- Acceptance Criteria:
  - Default enabled; interval 10s; fires only when buffer is dirty.
  - Uses `<file>.tmp` + atomic rename; no history snapshots.
- Testing Strategy:
  - Inject shorter interval in tests; assert writes occur only when dirty and stop when clean.

## LR-13 — Open Flow & Chapter Selection

- ID: LR-13
- Name: Open Flow & Chapter Selection
- Acceptance Criteria:
  - On launch from book root: open `state.json.last_opened_chapter`.
  - If missing/invalid: open lexicographically smallest `chapters/*.md` using case‑sensitive ordering; filter `.md` only.
- Testing Strategy:
  - Integration test with multiple chapters covering case ordering and missing state.

## LR-14 — Autosave Fallback on Open

- ID: LR-14
- Name: Autosave Fallback on Open
- Acceptance Criteria:
  - On open, if a valid `<chapter>.tmp` exists and its mtime is newer than the chapter file, load the tmp content instead.
  - Show a status message indicating autosave recovery; buffer marked dirty.
- Testing Strategy:
  - Create chapter and newer `.tmp`; assert recovered content loaded and message displayed.

## LR-15 — Characters Screen

- ID: LR-15
- Name: Characters Screen
- Acceptance Criteria:
  - List and edit characters with schema: `{id, name, notes}` only; `next_id` maintained in `characters.json`.
  - Changes persist across restarts.
- Testing Strategy:
  - Unit tests for CRUD via repo; UI smoke test for list/edit interactions.

## LR-16 — World Screen

- ID: LR-16
- Name: World Screen
- Acceptance Criteria:
  - List and edit world elements with schema: `{id, kind, name, notes}` only; `next_id` maintained in `world.json`.
  - Changes persist across restarts.
- Testing Strategy:
  - Unit tests for CRUD via repo; UI smoke test for list/edit interactions.

## LR-17 — End‑to‑End Flow

- ID: LR-17
- Name: End‑to‑End Flow
- Acceptance Criteria:
  - Init → new chapter → type → autosave → manual save → reopen (with autosave fallback) → edit characters/world → quit with lock cleanup.
- Testing Strategy:
  - Integration test across a temp book directory asserting all side effects and persisted state.

## LR-18 — README & Usage

- ID: LR-18
- Name: README & Usage
- Acceptance Criteria:
  - README snippet matches stack doc: Linux + Python 3.11, optional `uv`, “clone → run” instructions.
  - Examples for `./run`, `liriac init`, `liriac open <path>`.
- Testing Strategy:
  - Link checks and basic command invocations in CI to ensure examples do not drift.
