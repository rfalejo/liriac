# Liriac

A web-based writing studio built with Vite + React on the frontend and a local Django API for context-aware AI assistance.

## Project overview

- **Frontend**: `frontend/` hosts a single-page app. The entry flow is `src/main.tsx` → `App.tsx` → `pages/EditorPage.tsx`, which wires together the editor surface, settings dialog, toast system, and status bar.
- **Backend**: `backend/` contains a Django project (`config/`) and the `studio` app that exposes REST endpoints consumed by the SPA.
- **API client**: `frontend/src/api/client.ts` centralizes fetch logic. The base URL defaults to `http://localhost:8000`; override it with a `frontend/.env.local` file containing `VITE_API_URL=<your-url>` when needed.
- **State management**: `frontend/src/store/appStore.tsx` provides a persisted Zustand store that EditorPage hydrates using `fetchLibrary()` and `fetchEditor()` responses.

## Getting started

### 1. Backend (Django API)

```bash
cd backend
uv sync --python 3.11           # create .venv with uv
uv run python manage.py migrate # apply initial migrations
uv run python manage.py runserver
```

> Keep the server running so the SPA can hydrate with live data at `http://localhost:8000`.

### 2. Frontend (Vite dev server)

```bash
cd frontend
pnpm install --frozen-lockfile --silent
pnpm run --silent dev           # Vite dev server
```

Optional maintenance commands:

```bash
pnpm run --silent lint          # ESLint
pnpm run --silent typecheck     # tsc --noEmit
pnpm run --silent test          # Vitest
pnpm run --silent build         # Production bundle
```

The dev server proxies requests to the Django API using the `VITE_API_URL` setting.

## Updating shared API types

When backend schemas change, regenerate both the OpenAPI document and the typed client:

```bash
cd backend
uv run python manage.py spectacular --file schema.yaml

cd ../frontend
pnpm run --silent generate:api
```

This refreshes `frontend/src/api/schema.ts`, keeping the SPA in sync with the backend contracts.