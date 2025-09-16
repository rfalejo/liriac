# Metadata
Project name: liriac  
Description: React + TypeScript single-page application backed by a Django API that enables writing books and chapters with streaming AI assistance, contextual personas, and reliable autosave.

## Frontend Overview
The client is a Vite-powered React 18 SPA written in strict TypeScript. Tailwind CSS provides layout and typography primitives; Headless UI helps with accessible modals, drawers, and menus. Core state lives in React Query (server cache) and Zustand (view preferences and transient UI flags). Routing relies on React Router with nested layouts for the library dashboard and editor. Global keyboard shortcuts attach once at the root and dispatch domain-specific actions via a dedicated hook.

## Manual Writing Mode
The editor renders a controlled `<textarea>`-like component optimized for large documents. Cursor movement and text editing respect native browser behavior, while custom handlers delegate critical shortcuts (save, toggle suggestions, open context modal). React Query hydrates chapter content from the Django API, caches responses, and updates optimistically when autosave succeeds. Tailwind utility classes keep the writing column fluid on desktop and compact on tablet viewports; a top app bar hosts navigation, autosave state, and suggestion status indicators.

## AI Suggestions Mode
Pressing Shift+Tab opens a bottom drawer implemented with Headless UI dialog primitives. The drawer contains:

```
Prompt input field with character counter
“Generating… 128 tokens [Esc x 2] Stop” status banner
Live token stream rendered line by line
Actions: Accept, Regenerate, Cancel
Suggestion pager: “Suggestion 1/2” with left/right arrows
```

When the user submits a prompt, the frontend sends a POST request to `/api/v1/chapters/{id}/suggestions/` (REST) to register the intent. The response includes a WebSocket URL (`/ws/suggestions/{session_id}/`) served by Django Channels. React Query (or a custom hook) subscribes to the socket and appends deltas to an in-memory buffer. Stopping the stream sends a cancellation frame; accepted suggestions merge into the editor state, regenerate spins up another session. All events are reflected in a suggestion log timeline.

## Context Management (Personas & Chapters)
The “Context” action launches a modal overlay with two panels:

- **Personas**: Checkboxes listing available personas. Toggling issues PATCH requests to `/api/v1/context/personas/` with optimistic updates; metadata (role, notes) comes from cached endpoints.
- **Chapters**: Multi-select list of context chapters loaded from `/api/v1/books/{id}/chapters/`. Token usage estimates update as selections change, drawing on `/api/v1/context/estimates/`.

Context configuration is persisted per chapter. Validation happens both client-side (preventing token limits) and server-side (hard ceilings enforced by Django).

## Autosave
Autosave triggers ten seconds after the last keystroke or immediately after accepting an AI suggestion. The editor maintains a content hash; if unchanged, the client skips network calls. Save requests hit `/api/v1/chapters/{id}/autosave/` with the current body and checksum. The backend replies with the persisted hash and timestamp. Feedback surfaces in the status bar:

```
Mode: Manual • Autosave: saving…
Mode: Manual • Autosave: saved 2s ago
```

Failures display toast notifications with retry actions. The SPA also mirrors drafts to `IndexedDB` (via `idb-keyval`) to protect against transient offline periods.

## Screens and Navigation

### Library Dashboard
```
+---------------------------------------------------------------+
| liriac — Library                                              |
|                                                               |
| Books                               Chapters (selected book)   |
| ┌───────────────────────────────┐   ┌────────────────────────┐ |
| │ ▶ El viajero                  │   │ ▶ Cap 01: La salida    │ |
| │   La ciudad invisible         │   │   Cap 02: El mapa      │ |
| │   Bosque de vidrio            │   │   Cap 03: El puerto    │ |
| └───────────────────────────────┘   └────────────────────────┘ |
|                                                               |
| Details: Created 2024‑09‑01 • Chapters: 27 • Last opened: Cap 03 |
+---------------------------------------------------------------+
Actions: [Enter] Open chapter • [N] New book • [C] New chapter • [Esc] Exit
```

Cards and lists reuse Tailwind component patterns. Keyboard shortcuts are captured at the route level and routed through a custom hook to keep focus states synchronized.

### Editor (Manual Mode)
```
+---------------------------------------------------------------+
| liriac — Book: "El viajero" — Chapter 03: "El puerto"         |
|                                                               |
|  The pier smelled of salt and damp wood.                      |
|  Gulls carved lazy circles above the flat water while ropes   |
|  creaked with every swell.                                    |
|                                                               |
|  Camila pressed the notebook to her chest and exhaled deeply. |
|  She expected no answers, only the murmur of the sea and the  |
|  thud of her boots.                                           |
|                                                               |
|  …                                                            |
|                                                               |
+---------------------------------------------------------------+
Footer: Mode: Manual • Book: El viajero • Chapter: 03 • Ln 12, Col 1 • Autosave: active (every 10s)
```

A sticky footer shows live status: autosave, suggestion progress, context summary. Tailwind variants adapt spacing and font size between desktop and tablet breakpoints.

### Suggestion Mode (Prompt + Streaming)
```
+---------------------------------------------------------------+
| liriac — Book: "El viajero" — Chapter 03                      |
|                                                               |
|  The pier smelled of salt and damp wood.                      |
|  …                                                            |
|  > The breeze carried a distant whisper, as if the ocean      |
|  > had guarded a secret for too long.                         |
|                                                               |
+---------------------------------------------------------------+
Prompt: “Raise tension and add a sensory detail”
Generating… 128 tokens [Esc x 2] Stop     Suggestions 1/2 ← →
Actions: [A] Accept • [R] Regenerate • [C] Cancel • [Shift+Tab] Toggle mode • [F10] Context
```

Suggestion text uses Tailwind color utilities to distinguish AI output. Accepting triggers autosave and logs the event through `/api/v1/suggestions/{id}/accept/`.

### Context Management Modal
```
+---------------------------------------------------------------+
| Context — Book: "El viajero" — Chapter 03                     |
|                                                               |
| Personas (Space toggles)            Chapters included         |
| ┌────────────────────────────┐      ┌───────────────────────┐ |
| │ [x] Camila (protagonist)   │      │ [x] Cap 01: La salida │ |
| │ [x] Tomás (brother)        │      │ [x] Cap 02: El mapa   │ |
| │ [ ] Silvia (antagonist)    │      │ [x] Cap 03: El puerto │ |
| │ [ ] Captain Herrera        │      │ [ ] Cap 04: La tormenta │
| └────────────────────────────┘      └───────────────────────┘ |
| System prompt tokens: 2.2k • Estimate: 3.1k • Limit: 8k         |
+---------------------------------------------------------------+
Actions: [Enter] Save • [Esc] Close • [Tab] Switch panel
```

Changes sync immediately with the API; conflict responses (e.g., exceeding limits) display inline validation messages.

### Autosave Indicators
```
Mode: Suggestion • Autosave: saving…
Mode: Suggestion
```
Indicators animate using Tailwind transitions and fade once the backend confirms persistence.

## Backend Overview
The backend is a Django 5 project using SQLite for structured data; chapter bodies are stored inline as text; no external object storage. REST endpoints are built with Django REST Framework; streaming updates use Django Channels over WebSockets. Key components:

- `apps.library`: models for books, chapters, personas, context profiles.
- `apps.suggestions`: AI session orchestration, streaming consumers, audit log.
- `apps.autosave`: idempotent autosave service, checksum verification, snapshot policy.
- `apps.users`: authentication (JWT or session) with permissions per book.
- Shared utilities for content hashing, token estimation, and structured logging.

All responses are JSON; errors follow RFC 7807 problem details.

## API Surface (draft)
- `GET /api/v1/books/` — list books (filters, pagination).
- `POST /api/v1/books/` — create book.
- `GET /api/v1/books/{book_id}/chapters/` — list chapters with metadata.
- `GET /api/v1/chapters/{chapter_id}/` — fetch chapter content.
- `POST /api/v1/chapters/{chapter_id}/autosave/` — idempotent save with checksum.
- `POST /api/v1/chapters/{chapter_id}/suggestions/` — start suggestion session (returns session id + ws url).
- `POST /api/v1/suggestions/{suggestion_id}/accept/` — accept suggestion.
- `POST /api/v1/suggestions/{suggestion_id}/reject/` — reject suggestion.
- `PATCH /api/v1/context/personas/` — update persona toggles.
- `PATCH /api/v1/context/chapters/` — update included chapters.
- `GET /api/v1/context/estimates/` — token estimation preview.

WebSocket: `ws://…/ws/suggestions/{session_id}/` streams events shaped as `{ "type": "delta" | "usage" | "done" | "error", ... }`.

## Data Model Highlights
- `Book`: title, slug, created_at, last_opened, relations to chapters and personas.
- `Chapter`: order index, title, storage path, content hash, updated_at.
- `Persona`: name, role, notes, enabled flag (per chapter association via through table).
- `Suggestion`: session id, chapter foreign key, status (`pending`, `accepted`, `rejected`), payload (delta log).
- `SuggestionEvent`: timestamped deltas for audit.
- `ContextProfile`: per chapter selection of personas/chapters, token estimates, system prompt reference.

Autosave snapshots live in `.liriac/versions/` and only persist when diffs exceed 100 characters; writes happen via atomic `os.replace`.

## Security & Observability
- Authentication: JWT (access + refresh) or signed session cookies. CSRF protection for unsafe requests if using sessions.
- Authorization: per-book ACLs enforced on every API call and WebSocket handshake.
- Logging: structured JSON with log levels; secrets redacted. Suggestion streams emit timing metrics for monitoring.
- Metrics: optional Prometheus exporter plus application-level counters persisted locally for analytics.
- Error handling: consistent problem-detail responses, with frontend mapping to user-friendly toasts.

## Testing Strategy
- Frontend: Vitest + React Testing Library for components, Playwright for end-to-end flows (full stack against dev servers).
- Backend: pytest + DRF test utilities for REST, Channels tests for streaming, contract tests verifying payload schemas.
- Shared contracts: OpenAPI schema generated by DRF Spectacular feeds `openapi-typescript` to keep TypeScript DTOs in sync.
- CI pipeline: lint (ESLint, ruff), format (Prettier, black), type check (tsc --noEmit, mypy), unit tests, integration tests.

This draft anchors the React + Django implementation while preserving the product intent: a web-based writing environment with AI-assisted suggestions, granular context control, and resilient autosave.
