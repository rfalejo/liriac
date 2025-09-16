# Technical Specification and Architecture — liriac

Goal: deliver a web-based writing environment composed of a React + TypeScript single-page application and a Django REST + WebSocket backend that enable AI-assisted chapter drafting, contextual personas, and resilient autosave.

## Design Principles

- Strong typing across the stack: strict TypeScript on the frontend, `mypy --strict` on Python, shared OpenAPI-derived DTOs.
- Modular boundaries: SPA handles presentation only; Django exposes validated use cases; domain logic stays in services/models.
- Streaming-first UX: AI suggestions arrive incrementally over WebSockets; UI renders tokens in real time without blocking.
- Idempotent persistence: autosave endpoints deduplicate writes via content hashes; backend enforces atomic writes and audit logs.
- Accessibility & performance: keyboard-first workflows, Tailwind utility styling, React Query caching, pagination on heavy lists.
- Observability & security: structured JSON logs, per-request tracing, encrypted secrets, strict ACLs per book.

## Requirements

- Runtime: Linux x86_64, Node.js 20+, pnpm 8+ (or npm), Python 3.12+, SQLite 3 (built-in), no Redis required, no external file storage.
- Tooling: Vite, React 18, React Router, React Query, Zustand, Tailwind CSS, Headless UI, Vitest, Playwright, ESLint, Prettier; Django 5, Django REST Framework, Django Channels, httpx, pytest, ruff, black.
- Communication: HTTP REST API under `/api/v1/` on localhost, WebSocket namespace `/ws/`, no authentication (local-only), CSRF protection not required.
- Packaging: pnpm scripts for frontend dev/build/test; UV or pip for backend; Docker Compose for local orchestration.

## Project Structure (proposed)

```
liriac/
├─ frontend/
│  ├─ package.json
│  ├─ pnpm-lock.yaml
│  ├─ vite.config.ts
│  ├─ tailwind.config.ts
│  └─ src/
│     ├─ app/                    # entry, routing, layouts
│     ├─ features/
│     │  ├─ library/
│     │  ├─ editor/
│     │  ├─ suggestions/
│     │  └─ context/
│     ├─ components/
│     ├─ hooks/
│     ├─ stores/                 # Zustand slices
│     ├─ api/                    # React Query clients, DTOs
│     ├─ styles/
│     ├─ utils/
│     └─ tests/
├─ backend/
│  ├─ manage.py
│  ├─ pyproject.toml
│  ├─ liriac/
│  │  ├─ settings/
│  │  │  ├─ __init__.py
│  │  │  ├─ base.py
│  │  │  └─ env/
│  │  ├─ urls.py
│  │  ├─ asgi.py                 # ASGI for Django + Channels
│  │  ├─ wsgi.py
│  │  └─ schema.py               # OpenAPI/DRF Spectacular schema
│  ├─ apps/
│  │  ├─ library/
│  │  ├─ chapters/
│  │  ├─ personas/
│  │  ├─ suggestions/
│  │  ├─ autosave/
│  │  └─ users/
│  ├─ infra/                     # external adapters (storage, tokens)
│  ├─ shared/                    # utilities, typing, enums
│  └─ tests/
├─ docs/
│  ├─ 00-draft.md
│  ├─ 01-technical-spec-en.md
│  └─ 02-backlog.md
├─ docker/
│  ├─ compose.yaml
│  └─ env/
└─ Makefile
```

Frontend and backend live in sibling directories to enable independent tooling while keeping version control unified.

## High-Level Architecture

- SPA: React Router provides nested layouts (library dashboard, editor). React Query synchronizes server state; Zustand stores view preferences. Keyboard shortcuts dispatch domain actions (toggle suggestions, accept, autosave).
- Backend: Django REST Framework delivers CRUD endpoints; domain logic encapsulates autosave validation, suggestions orchestration, and context checks. Django Channels handles WebSocket streaming of AI deltas using async consumers.
- Integration: No authentication; SPA connects to backend over localhost HTTP and WebSockets. Shared OpenAPI schema generates frontend DTO types.

```
React SPA ──REST──> Django REST (DRF) ──> Domain Services ──> Storage (SQLite)
    │                               │
    └──── WebSocket (Channels) <────┘
          Streaming suggestions/usage events
```

## Frontend Architecture Details

- Entry: `src/app/main.tsx` wires providers (React Query, Router, Zustand persistence, Theme).
- Layouts: `AppLayout` renders nav shell; `LibraryLayout` handles book list; `EditorLayout` hosts editor + drawers.
- Features:
  - Library: fetches `/books/` using React Query, displays paginated lists with Tailwind components.
  - Editor: controlled text area component with virtualization for long chapters, autosave indicators, sticky header/footer.
  - Suggestions: drawer component subscribes to WebSocket; tokens appended into a buffer, diffed for display.
  - Context: Headless UI modal with personas list and chapters multi-select; forms use React Hook Form + Zod validation.
- Networking: `api/client.ts` wraps fetch/http with base URL, interceptors for auth refresh, and response handling. Generated DTOs ensure static typing.
- State: Zustand slices for transient UI (which suggestion is focused, drawer open state) and global keyboard mapping. React Query caches chapter data keyed by chapter ID.
- Styling: Tailwind with custom config, dark mode ready, component-level variants for statuses (autosave, streaming).
- Testing: Vitest + Testing Library for components; Storybook (optional) for visual regression; Playwright for end-to-end flows (editor typing, autosave, suggestions).

## Backend Architecture Details

- Settings: split environment-specific settings (development, test, production) with `django-environ` or pydantic settings.
- Apps:
  - `library`: book CRUD, listings.
  - `chapters`: chapter models, repositories, autosave integration.
  - `personas`: persona definitions and per-chapter toggles.
  - `suggestions`: orchestrates AI provider requests, streams via Channels, logs events.
  - `autosave`: service layer performing hash comparison, writing to storage, snapshots management.
- REST Endpoints: DRF viewsets or APIViews returning JSON, using serializers with validation. Pagination for books/chapters. Autosave view enforces checksum semantics and returns status payload.
- WebSockets: Channels routing with `AuthMiddlewareStack`; per-session group names (e.g., `suggestion_{session_id}`). Async consumer fetches AI streaming response (httpx or provider SDK) and relays `delta`, `usage`, and `done` events. Cancellation supported through incoming `STOP` frames.
- Storage: SQLite relational database; chapter bodies stored inline (text fields). Autosave snapshots stored in database tables; no external file storage.
- AI Provider: pluggable interface supporting OpenAI-compatible streaming. Retries on transient errors, timeout 120s, respect cancellation.
- Observability: structured logging with `structlog` or `logging` JSON formatter, request IDs, user-level audit trail for suggestions. Metrics exported via Prometheus endpoint or StatsD.

## Data Format and Storage

- All data stored in SQLite: books, chapters (text bodies), personas, suggestions, autosave snapshots.
- No filesystem layout required for runtime; import/export to files may be added later as a separate feature.
- Autosave snapshots persisted as relational records; no `.liriac/` folders or external object storage.
- Persona associations via many-to-many join table with additional metadata (enabled flag per chapter). Context selections tracked in dedicated table.

## API Surface (v1)

- `GET /api/v1/books/`: list books with pagination (query params: `page`, `search`).
- `POST /api/v1/books/`: create book (title, slug, optional author).
- `GET /api/v1/books/{book_id}/`: book detail.
- `GET /api/v1/books/{book_id}/chapters/`: list chapters for book with metadata (titles, last updated).
- `POST /api/v1/books/{book_id}/chapters/`: create chapter.
- `GET /api/v1/chapters/{chapter_id}/`: fetch chapter body + hash.
- `PATCH /api/v1/chapters/{chapter_id}/`: update metadata (title/order).
- `POST /api/v1/chapters/{chapter_id}/autosave/`: payload `{ body: str, checksum: str }`; response returns `{ saved: bool, checksum: str, saved_at: datetime }`.
- `POST /api/v1/chapters/{chapter_id}/suggestions/`: start suggestion, returns `{ session_id, websocket_url }`.
- `POST /api/v1/suggestions/{suggestion_id}/accept/`: merge accepted suggestion, triggers autosave service.
- `POST /api/v1/suggestions/{suggestion_id}/reject/`.
- `PATCH /api/v1/context/personas/`: update persona selections for chapter.
- `PATCH /api/v1/context/chapters/`: update included chapters for context.
- `GET /api/v1/context/estimates/`: returns `{ tokens_estimated: int, limit: int }`.

OpenAPI schema generated via DRF Spectacular; published for frontend consumption and contract testing.

### WebSocket Contract (`/ws/suggestions/{session_id}/`)

Client sends JSON frames for control (`{"type": "stop"}` to cancel). Server emits:

```
{ "type": "delta", "value": "The breeze..." }
{ "type": "usage", "prompt_tokens": 120, "completion_tokens": 90 }
{ "type": "error", "message": "Timeout" }
{ "type": "done" }
```

Consumers detect `done` or `error` to close connection. Deltas are appended in order received.

## Core Flows

1. **Open Book & Chapter**
   - SPA loads `/api/v1/books/` on dashboard mount.
   - Selecting book fetches `/books/{id}/chapters/`, caches results.
   - Opening chapter pulls `/chapters/{id}/` with body + checksum → editor state hydrated.
   - Autosave status initial state derived from response (last saved timestamp).

2. **Autosave**
   - Editor triggers debounce (10s) or immediate call after suggestion acceptance.
   - SPA sends POST with `body`, `checksum`.
   - Backend verifies checksum; if unchanged, returns `saved: false`.
   - On success, backend updates chapter text, writes snapshot if diff threshold met, logs event.
   - SPA updates status indicator and React Query cache.

3. **Suggestion Streaming**
   - User opens drawer, enters prompt, submits.
   - SPA POSTs to `/chapters/{id}/suggestions/` with prompt + context selection.
   - Backend creates suggestion record, enqueues AI provider stream, responds with session + WS URL.
   - SPA connects WebSocket, listens for `delta` events. Tokens appended to suggestion buffer state.
   - Accept: SPA POSTs to `/suggestions/{id}/accept/` with final text; backend merges, triggers autosave service, logs acceptance.
   - Regenerate uses original prompt or updated context to start new session; SPA keeps session history.

4. **Context Management**
   - SPA fetches personas and context chapters to populate modal.
  - PATCH operations perform optimistic updates; backend validates token limits, returns updated profile or error.
  - Token estimation uses heuristics (word length, persona count) with fallback to `tiktoken` if configured.

## Autosave Service (Backend)

- `AutosaveService.schedule(chapter_id, content, checksum)` handles dedupe.
- Writes temp file in same directory, uses `os.replace` to ensure atomicity.
- Maintains `ChapterVersion` records with diff metadata; snapshots only when diff >= 100 chars.
- Logs `AutosaveEvent` with user ID, timestamp, duration, whether triggered by manual or suggestion accept.

## AI Suggestions Service

- `AIProvider` protocol defines async `stream(prompt, settings, context)` returning async iterator.
- Implementation for OpenAI-compatible endpoints uses httpx streaming POST with exponential backoff on network errors (two retries).
- Cancellation pipeline: user stop command sets `SuggestionSession.status = "cancelled"`; provider stream closed via context manager.
- Usage metrics stored to `SuggestionUsage` table for analytics.

## Security & Privacy

- Local-only: runs on localhost for development and personal use; do not expose publicly.
- Authentication: none; all endpoints accessible without login.
- Authorization: none; no user-specific data or ACLs enforced.
- CSRF: not applicable for local-only usage.
- Secrets: minimal configuration via environment; no sensitive secrets stored.
- Auditing: suggestion events can be logged locally for debugging without user identifiers.
- Data retention: persisted in local SQLite database; no PII beyond content itself.

## Logging & Observability

- Backend uses `structlog` (JSON) with context (user, request ID, book ID).
- Frontend central logger reports non-PII errors (Sentry optional).
- Metrics: Prometheus counters for `autosave_requests`, `suggestions_started`, `suggestions_completed`, `autosave_failures`.
- Tracing: optional OpenTelemetry instrumentation for REST + WebSocket flows.

## Testing Strategy

- Frontend:
  - Unit tests (Vitest) for components/hooks.
  - Integration tests for flows (editor typing, autosave state).
  - Playwright E2E against local backend using seeded fixtures.
  - Contract tests verifying DTO shapes against generated OpenAPI types.
- Backend:
  - pytest with `pytest-django` for models, services, API views.
  - Channels tests for WebSocket consumers (using `channels.testing.ApplicationCommunicator`).
  - Provider mocks for deterministic AI streaming outputs.
  - `mypy --strict`, `ruff`, `black` enforced pre-commit.
- CI pipeline:
  - `pnpm lint`, `pnpm test`, `pnpm build`.
  - `uv run ruff`, `uv run mypy`, `uv run pytest`.
  - `docker compose` integration stage for end-to-end tests.

## Deployment & Operations

- Containerization: separate Dockerfiles for frontend (Vite build → static assets served via Nginx) and backend (Gunicorn + Uvicorn worker for ASGI).
- Reverse proxy: Nginx routes `/` to SPA, `/api/` and `/ws/` to backend; enables CORS and WebSocket upgrades.
- Environment management: `.env` files for backend, `.env.local` for frontend; secrets injected via platform (Kubernetes/Heroku).
- Migrations: Django migrations run before deploy. Frontend build artifacts versioned with cache-busting.
- Monitoring: set up health checks for REST and WebSocket; log aggregation via ELK/CloudWatch.

## MVP Roadmap

1. **Tooling Setup**
   - Scaffold frontend (Vite + pnpm) and backend (Django + DRF + Channels).
   - Configure linting, formatting, typing, testing pipelines.
   - Establish shared OpenAPI generation and DTO sync.

2. **Core Models & API**
   - Implement books/chapters/personas models, migrations, CRUD endpoints.
   - Secure authentication and baseline permission checks.

3. **Frontend Library & Editor**
   - Build library dashboard with book/chapter navigation.
   - Implement editor view with autosave indicator and manual save.

4. **Autosave Service**
   - Backend autosave endpoint with checksum logic.
   - Frontend debounce + optimistic updates, error handling.

5. **Suggestions Streaming**
   - Integrate AI provider client, WebSocket consumer, suggestion drawer UI.
   - Support accept/regenerate/cancel flows and logging.

6. **Context Management**
   - Modal UI, persona/chapter selection endpoints, token estimation feedback.

7. **Observability & Hardening**
   - Logging, metrics, rate limiting, error reporting.
   - Comprehensive tests (unit, integration, e2e), performance profiling for large chapters.

8. **Release Prep**
   - Production build pipeline, Docker images, deployment manifests.
   - Final documentation (user guide, ops runbook).

This specification aligns with the revised architecture mandate and guides implementation for both the SPA and Django API components.
