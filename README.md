# Liriac

Liriac is a workspace for exploring and editing narrative content. It ships a Vite + React frontend styled with Material UI and a Django backend that can power future data workflows.

## Repository layout

- `frontend/` – React application with feature-based folders. The entry point is `src/main.tsx` → `App.tsx`, which mounts the library dashboard and the editor experience.
	- `src/features/library/` – book and chapter discovery, shared data context, and supporting hooks.
	- `src/features/editor/` – full-screen editor shell, chapter viewport, and editing blocks.
	- `src/api/` – REST helpers for the library and chapter endpoints.
- `backend/` – Django project (`config/`) plus the `studio` app, ready for service integrations when the frontend needs live data.
- `docs/`, `scripts/` – documentation stubs and utility scripts.

## Key frontend flows

- **Library landing**: lists books, chapters, and contextual sections. Selecting a chapter opens the editor.
- **Editor**: renders the chapter as a standalone screen with navigation, content blocks, and insertion controls. The naming now reflects its editing role instead of a modal preview.
- **Data context**: `LibraryDataProvider` wires React Query hooks and exposes `openEditor`/`closeEditor` state so UI layers stay lean.

## Getting started

### Backend (optional)

```bash
cd backend
uv sync --python 3.11
uv run python manage.py migrate
uv run python manage.py runserver
```

Start the backend if you plan to expand the frontend with API calls at `http://localhost:8000`.

### Frontend

```bash
cd frontend
pnpm install --frozen-lockfile --silent
pnpm run --silent dev
```

Useful scripts:

```bash
pnpm run --silent build      # Production bundle
pnpm run --silent preview    # Serve the built assets
pnpm run --silent lint       # ESLint with --max-warnings 0
pnpm run --silent typecheck  # TypeScript --noEmit
pnpm run --silent format     # Prettier check
```

## Material UI & TypeScript tips

- Theme setup lives in `frontend/src/App.tsx`. Extend it with `createTheme` overrides when you need custom palette or typography.
- Prefer the `sx` prop for one-off styling and elevate repeated patterns to theme overrides or `styled()` helpers.
- The project uses co-located feature folders—place hooks, view components, and tests beside the feature they support.
- Keep UI copy in Spanish while writing code, comments, and identifiers in English for consistency with linting and TypeScript expectations.