# Liriac — Product Backlog (MVP, Web SPA + Django API)

## Status
- Overall: Planned
- Last updated: 2025-09-16
- Scope: MVP (local-only)
- Source docs: `docs/00-draft.md`, `docs/01-technical-spec-en.md`, `docs/03-conventions.md`

## Policy
- Definition of Done: code + tests + docs.
- Tests required per ticket:
  - Unit tests for new logic and edge cases.
  - Integration tests for API routes/consumers where applicable.
  - Contract tests when changing OpenAPI schema or WebSocket event shapes.
  - E2E tests only for critical user-facing flows.
- CI gating: lint, typecheck, and tests must pass; PRs without tests are not mergeable.

## Epics
- Core Tooling & DX
- Frontend SPA
- Backend API
- OpenAPI & Types
- Suggestions Streaming (WebSocket)
- Autosave & Persistence
- Context Management
- Logging & Metrics
- Test Infrastructure & Quality Gates
- Deployment

## Backlog Items (High-level)
- BL-001: Initialize monorepo layout with `frontend/` (Vite + React 18 + TS) and `backend/` (Django 5 + DRF + Channels).
- BL-002: Configure linters/formatters: ESLint/Prettier (frontend), ruff/black (backend); strict TypeScript and `mypy --strict`.
- BL-003: Makefile workflows: `fe-dev`, `fe-build`, `fe-test`, `schema`, `fe-typegen`, `run`, `test`, `check`, `clean`.
- BL-004: Backend models: `Book`, `Chapter`, `Persona`, `Suggestion`, `SuggestionEvent`, `ContextProfile`, `ChapterVersion`.
- BL-005: DRF serializers/viewsets for books/chapters/personas; pagination, filtering, and validation.
- BL-006: Autosave service: checksum dedupe, DB transactions, snapshot threshold (≥ 100 chars), audit events.
- BL-007: Suggestions service: provider interface, OpenAI-compatible HTTP streaming via httpx with backoff and timeouts.
- BL-008: Channels setup: ASGI, routing under `/ws/`, suggestion consumer (delta/usage/error/done), cancel support.
- BL-009: OpenAPI schema via DRF Spectacular; publish `backend/schema.yaml`.
- BL-010: Frontend DTO generation using `openapi-typescript` → `frontend/src/api/types.ts` and client helpers.
- BL-011: SPA shell: routing (editor-first `/`, deep links `/books/:bookId/chapters/:chapterId`), layout, theme.
- BL-012: Library dashboard (deprecated in UI): list books and chapters with React Query, pagination, basic create flows (access via palette and Top Bar quick actions).
- BL-013: Editor: large text area, status bar (mode, autosave state, cursor), keyboard shortcuts; palette-first navigation (BL-013C).
- BL-014: Autosave (frontend): 10s debounce, checksum skip, optimistic updates, IndexedDB mirror for resilience.
- BL-015: Suggestions UI: bottom drawer (Headless UI), prompt form, live token stream, actions (accept/regenerate/cancel).
- BL-016: Context modal: personas and chapters selection with optimistic PATCH; token estimate preview.
- BL-017: UI state persistence: last opened book/chapter; drawer and modal states; settings in localStorage.
- BL-018: Logging & metrics: JSON logs in backend; minimal frontend error reporting; Prometheus-style counters (local).
- BL-019: Test infrastructure and mocks: shared test utilities, provider fakes, Channels test helpers, OpenAPI contract check; used by all tickets.
- BL-020: Dev/prod setup: CORS and WS proxies; Dockerfiles; reverse proxy config; health endpoints.

## Detailed Acceptance (Key Items)

- BL-004 (Models)
  - Book: title, slug, created_at, last_opened.
  - Chapter: book FK, title, order, body (text), checksum, updated_at.
  - Persona: name, role, notes.
  - ContextProfile: chapter FK, M2M personas/chapters, token estimate fields.
  - Suggestion: chapter FK, status, session_id, created_at.
  - SuggestionEvent: suggestion FK, event type, payload, timestamp.
  - ChapterVersion: chapter FK, body, checksum, created_at, diff_size.
  - Testing: includes unit tests for models/validators; migration smoke tests.

- BL-006 (Autosave)
  - POST `/api/v1/chapters/{id}/autosave/` with `{ body, checksum }`.
  - Response `{ saved: bool, checksum: str, saved_at: datetime }`.
  - No write when checksum unchanged; snapshot on diff ≥ 100 chars.
  - Testing: unit tests for checksum logic; integration tests for endpoint behavior.

- BL-008 (WebSocket)
  - Path: `/ws/suggestions/{session_id}/`.
  - Messages:
    - `{ "type": "delta", "value": "..." }`
    - `{ "type": "usage", "prompt_tokens": int, "completion_tokens": int }`
    - `{ "type": "error", "message": "..." }`
    - `{ "type": "done" }`
  - Client cancel: `{"type": "stop"}`.
  - Testing: consumer tests with Channels test client; contract tests for event shapes.

- BL-015 (Suggestions UI)
  - Start via POST `/api/v1/chapters/{id}/suggestions/` returns `{ session_id, websocket_url }`.
  - Drawer renders live deltas; Accept merges into editor and triggers autosave.
  - Testing: component tests with mocked WS; E2E happy-path for accept flow.

- All BL items
  - Testing: includes unit tests; integration where applicable; contract tests when API/WS shapes change; CI green on lint/type/tests.

## Milestones & Order
- M1: Core Tooling & Structure (BL-001–003, BL-009–010)
- M2: Backend Domain & CRUD (BL-004–005, BL-018)
- M3: SPA Shell & Library (BL-011–012)
- M4: Editor & Autosave (BL-013–014, BL-006)
- M5: Suggestions Streaming (BL-007–008, BL-015)
- M6: Context Management & UX Polish (BL-016–017)
- M7: Test Infrastructure & Hardening (BL-019–020)

## Out of Scope (MVP)
- User authentication and authorization.
- Multi-user collaboration or remote deployment.
- Export formats (EPUB/PDF/HTML).
- Undo/Redo and complex editor features.
- External storage (S3, Redis) or non-SQLite databases.

## Risks & Mitigations
- CORS/WS proxy issues: standardize base URLs; local reverse proxy config; health checks.
- Large chapter performance: textarea virtualization, debounced renders, avoid heavy string concatenation; test with long texts.
- Streaming robustness: retries with backoff; cancellation propagation; guard against partial frames.
- Data loss: checksum dedupe; IndexedDB mirror; explicit save affordance.
- Schema drift: CI step for OpenAPI generation and TS typegen; contract tests.
- Concurrency: single-process assumption for MVP; DB transactions around autosave and accept flows.

## Notes
- Local-only MVP: no auth, no CSRF; secure-by-default later.
- Strict typing enforced end-to-end; avoid `any`/`cast()` unless justified.
- Keep UX keyboard-first; ensure accessible components with Headless UI and ARIA patterns.
- Prefer simplicity; defer advanced features until after MVP usability validation.
