# Domain Model

This document captures the core domain modeling choices for liriac. It reflects the recommended options selected in design discussions and provides concise guidance for implementers.

## Overview

- Aggregates: Book, Chapter. Characters and World are standalone concepts.
- Entities: Simple dataclasses with light validation where needed.
- Immutability: Mutable dataclasses for MVP; no domain events.
- Types: Python `dataclasses` + minimal `NewType` + `Enum` where helpful.
- Errors: Domain raises a small `DomainError` hierarchy; app maps to messages.
- ContextBuilder: Simple planner; calls tokenizer directly.
- Tokenization: Direct library call by adapter/service; domain code stays simple.
- Rendering: Domain outputs structured variables; adapters render templates.
- AI append-only: Enforced in Chapter; manual edits allowed via separate operation.
- Versioning: None for MVP; rely on atomic writes and snapshots.
- Time/IDs: Direct library calls in adapters (no domain ports).
- Defaults: Business defaults live in domain.
- Units: `TokenCount` may remain a `NewType[int]` but can be plain int initially.
- Identifiers: `ChapterId` as `"ch_01"`, also `number: int`. `Slug` VO.
- De-duplication: Deterministic merge keys in domain.
- Budget overrun: Deterministic trim order; return preview with suggested trims (no events).
- Streaming: Domain unaware.
- Summaries: Not implemented for now.

## Aggregates

- Book (Aggregate Root)
  - Identity: `BookId` (NewType[str])
  - Slug: `Slug` (VO, lowercase-hyphenated)
  - Holds: metadata and configuration defaults.
  - Does not contain child aggregates; references them via ids.
  - Versioning: none (MVP)

- Chapter (Aggregate Root)
  - Identity: `ChapterId` (VO `"ch_01"`) and `number: int`
  - Title: `Title` (VO)
  - Text: immutable `Markdown` value
  - Policy: AI append-only; manual edits allowed via explicit operation
  - Versioning: none (MVP)
  - Events: `ChapterAppended`, `ContextOverBudget`

- Characters and World
  - Modeled as domain concepts/entities persisted separately.
  - Scoped to a Book namespace (ids are unique within a Book).
  - Referenced by `ChapterContext` selection.
  - Cross-book sharing/templates are out of scope for now; consider copy-on-write templates later.

## Entities and Value Objects

- Entities (examples)
  - `Book`, `Chapter`, `Character`, `WorldSection` (e.g., Location, Faction, Rule, TimelineEntry)

- Value Objects (examples)
  - `BookId: NewType('BookId', str)`
  - `ChapterId: NewType('ChapterId', str)` with format `"ch_XX"`
  - `Slug` (validated: lowercase, hyphenated, no spaces)
  - `Title` (non-empty, trimmed)
  - `POV` (Enum or VO)
  - `TokenCount: NewType('TokenCount', int)` (units: provider tokens)
  - `Timestamp: NewType('Timestamp', str)` (ISO-8601 in domain, adapters may use `datetime`)
  - `StopPolicy` (VO: immutable list of stop sequences with validation)
  - `Markdown` (opaque text wrapper to signal semantics)

VOs are compared by value and are immutable.

## Immutability and Versioning

- Domain entities are `@dataclass` (mutable) for MVP.
- Mutator operations validate invariants and update fields directly.
- No domain events; functions return updated entities or raise errors.
- No versioning in domain; rely on atomic writes and history snapshots.

## Type System

- Use `dataclasses` for entities/VOs (mutable for MVP).
- Use `typing.NewType` for ids and `TokenCount`.
- Use `Enum` for controlled vocabularies (e.g., `POV`, `Genre` if needed).
- Avoid runtime-heavy validation in domain types; prefer constructor guards/invariants.

## Error Handling

- Base: `class DomainError(Exception): ...`
- Examples:
  - `InvariantViolation(DomainError)`
  - `ConcurrencyConflict(DomainError)`
  - `AppendRejected(DomainError)` (append-only rule)
  - `SlugInvalid(DomainError)`
  - `ContextOverBudget(DomainError)` (raised or emitted as event depending on path)
- Application layer maps domain errors to `Result[T, E]` or user-facing messages.

## Domain Events

- None in MVP. Keep the model simple; return values and errors only.

## Context Builder

- Simple service responsible for:
  - Selection and priority ordering:
    1) chapter synopsis/beats
    2) selected characters
    3) selected world sections
    4) previous chapter summaries
    5) full previous text until budget
  - De-duplication (deterministic by id, then normalized name)
  - No automatic trimming; returns a preview with overruns and suggested trims
  - Producing structured variables for rendering
- Token counting:
  - Calls tokenizer/counting library directly (no domain port).

## Token Counting

- Use a direct tokenizer/counting library in the adapter/service layer.
- Units: OpenAI-style tokens (documented).
- Domain remains free of provider SDKs.

## Template Rendering

- Domain outputs a `PromptVariables` structure only.
- Rendering to a string is an adapter responsibility (e.g., Jinja2).

## Append-Only Policy (Chapter)

- AI operation: `append_text(delta: Markdown, stop: StopPolicy) -> (Chapter, events)`
- Validations (AI):
  - No edits to existing text.
  - `stop.sequences` validated (non-empty strings, reasonable length).
  - Optional hard stops (e.g., `"\n\n"`) are applied by adapters; domain only validates policy shape.
- Manual operation: `apply_user_edit(full_text: Markdown) -> (Chapter, events)`
  - Replaces chapter text arbitrarily; increments `version`.
  - Adapter must ensure the origin is a human edit.
- Events include token deltas if adapter supplies counts.

## History and Versioning

- Domain: no version field in MVP.
- Infrastructure:
  - Snapshot writes to `history/ch_XX/yyyymmdd-hhmmss.md`.
  - Git integration is out-of-domain.

## Repositories and Transactions

- MVP uses thin file helpers per resource under `books/<slug>/`.
- No repository interfaces or Unit of Work in domain.
- Add abstractions later if/when multiple backends are needed.

## Concurrency

- No optimistic locking in domain for MVP.
- Rely on atomic file writes; surface conflicts as user-facing errors if encountered.

## Time and IDs

- Use direct library calls (e.g., `datetime.now().isoformat()`, `uuid4()`).
- Keep such calls in adapters/services; domain types remain plain.

## Defaults and Configuration

- Domain holds pragmatic defaults, e.g.:
  - Previous chapters: include full previous text up to budget (default).
  - Deterministic trim order for context.
- App/adapters may override defaults via configuration, but domain defines behavior.

## Token Units

- `TokenCount` is an integer count of provider tokens.
- Always document the tokenizer used by the adapter.

## Identifiers and Numbering

- `ChapterId`: zero-padded `"ch_01"`, derived from `number: int`.
- `Slug`: enforced in domain (`[a-z0-9-]+`, no leading/trailing `-`, no spaces).
- Filenames are adapter concerns but follow the id/slug scheme.

## De-duplication

- Merge keys:
  - Primary: entity `id`
  - Fallback: normalized `name` (lowercase, spaces collapsed, punctuation stripped)
- Later duplicates are dropped deterministically.

## Budget Overrun

- When over budget:
  - Do not auto-trim; surface overrun to user.
  - Return a preview object with suggested trims (no events).
- Optionally allow a strict mode (adapter choice) to fail-fast.

## Previous Chapters Default

- Default include policy: full previous text up to token budget.
- Future option: switch to “latest N chapters” without changing domain contracts.

## Stop Sequences

- `StopPolicy` VO validates a bounded set of sequences.
- Applied by adapters/providers; domain tracks policy with append operations.
- Model-specific validation may be applied by adapters; domain validates basic shape only.

## Streaming

- Domain is stream-agnostic.
- Adapters handle provider streaming and persist only final deltas.
- Domain receives final `delta` for append.

## Summaries

- Not implemented now.
- When added: summaries as cached fields in chapter metadata managed by adapters; domain may validate staleness timestamps.

## Serialization and DTOs

- Domain types are not coupled to file formats.
- Adapters map:
  - Domain <-> `*.json` DTOs
  - Domain <-> `*.md` chapter text

## Delivery Tickets

Below are implementation tickets for the domain layer. Each includes scope, deliverables, acceptance criteria, and testing strategy.

### L-01 — Domain Error Hierarchy
- Scope: Define base `DomainError` and specific exceptions used across the domain.
- Deliverables: `DomainError`, `InvariantViolation`, `ConcurrencyConflict`, `AppendRejected`, `SlugInvalid`, `ContextOverBudget`.
- Acceptance: Errors are importable and used by stubs in entities/services; docstrings explain purpose and when to raise.
- Testing Strategy: Unit tests assert class hierarchy, raising/handling examples, and message formatting.

### L-02 — Value Objects: Identifiers and Basics
- Scope: Implement `BookId`, `ChapterId ("ch_XX")`, `Slug`, `Title`, `Markdown`, `TokenCount`, `Timestamp`.
- Deliverables: Validating constructors/helpers; normalization for `Slug`; format guard for `ChapterId`; trivial wrapper for `Markdown`.
- Acceptance: Creating valid instances succeeds; invalid inputs raise `SlugInvalid` or `InvariantViolation`; `ChapterId` zero-padding helper present.
- Testing Strategy: Parametrized tests for valid/invalid slugs, chapter id formatting, and VO equality/immutability semantics where applicable.

### L-03 — StopPolicy VO
- Scope: Implement immutable `StopPolicy` with validation for non-empty, reasonable-length string sequences.
- Deliverables: `StopPolicy` dataclass/VO with `.sequences: tuple[str, ...]` and validation function.
- Acceptance: Empty or overly long sequences rejected with `InvariantViolation`; valid policies preserved and comparable by value.
- Testing Strategy: Boundary tests for empty/too-long items, duplicates handling (preserve order, dedupe optional), and repr/equality.

### L-04 — Entities: Book and Chapter
- Scope: Define `Book` and `Chapter` dataclasses with fields from the domain doc; include light invariants.
- Deliverables: Dataclasses, constructors/factory helpers, and basic methods to update metadata/title.
- Acceptance: Instances can be created with minimal required fields; invalid titles/slugs rejected; chapter `number` and `ChapterId` remain consistent.
- Testing Strategy: Construction happy-path tests; invariant violations; serialization-friendly shapes (no surprises like properties-only state).

### L-05 — Chapter Operations: Append-Only + User Edit
- Scope: Implement `append_text(delta: Markdown, stop: StopPolicy)` and `apply_user_edit(full_text: Markdown)`.
- Deliverables: Methods on `Chapter` returning updated entity (and optional events placeholder); enforce append-only on AI path.
- Acceptance: `append_text` concatenates only at end; attempts to modify existing text path raise `AppendRejected`; `apply_user_edit` replaces text freely.
- Testing Strategy: Tests for append success, reject mid-text edits, multi-append ordering, and user edit replacement.

### L-06 — ContextBuilder Service (Planner)
- Scope: Implement simple planner that assembles structured context variables per priority order with preview/overrun info.
- Deliverables: `ContextBuilder` with inputs (chapter config + selections) and outputs: `PromptVariables`, `Preview` with sizes and overrun.
- Acceptance: Deterministic ordering applied; de-duplication by id then normalized name; returns suggested trims when over budget.
- Testing Strategy: Fixture-driven tests with sample selections; snapshot/golden tests for preview structure; dedupe and budget calculations.

### L-07 — PromptVariables Structure and Rendering Boundary
- Scope: Define `PromptVariables` dataclass independent of rendering; adapters will format strings later.
- Deliverables: Typed structure capturing metadata, selected characters/world, prev summaries/full text, chapter synopsis/beats.
- Acceptance: Structure serializes to dict cleanly; no provider-specific tokens or SDK types leak in.
- Testing Strategy: Round-trip to dict/json compatibility tests; field presence/typing assertions.

### L-08 — Defaults and Deterministic Trim Order
- Scope: Centralize domain defaults (e.g., include full previous text up to budget) and the trim priority.
- Deliverables: Constants/config in domain module; small helper to compute ordered trim suggestions.
- Acceptance: Given inputs and budget, helper returns stable suggestion order matching the documented priority.
- Testing Strategy: Table-driven tests for various overruns verifying order and boundaries.

### L-09 — DTO Mapping Contracts (Domain <-> Storage Shapes)
- Scope: Define lightweight mapping helpers for adapters to convert between domain entities/VOs and storage DTOs (`*.json`, `*.md`).
- Deliverables: Pure functions for serialize/deserialize of `Book`, `Chapter`, and VOs; no IO performed.
- Acceptance: Mapping preserves ids and invariant-relevant fields; invalid DTOs raise appropriate domain errors.
- Testing Strategy: Golden DTO samples; round-trip tests; negative tests for missing/invalid fields.

### L-10 — Domain Test Fixtures
- Scope: Provide reusable factories/fixtures for books, chapters, and context samples to support tests above.
- Deliverables: `tests/factories.py` or pytest fixtures; sample data for characters/world sections.
- Acceptance: Fixtures are used across ticket tests; easy overrides via params.
- Testing Strategy: Lint and run coverage including fixtures; ensure no network/IO in unit tests.
