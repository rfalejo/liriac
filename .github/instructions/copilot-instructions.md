---
applyTo: **
description: Comprehensive guide to Liriac's architecture, state management, and development workflows for AI agents.
---

# Liriac – AI agent quickstart

## Architecture snapshot
- The repo ships a minimal Vite/React SPA in `frontend/`.
- Entry flow: `src/main.tsx` → `App.tsx`, where Material UI manages theming, typography, and baseline layout.
- Global styles live in `src/index.css` and intentionally stay light so Material UI can own the visual system.

## Material UI usage
- Wrap new views in the existing `ThemeProvider` inside `App.tsx`; extend the theme with `createTheme` overrides when needed.
- Prefer the `sx` prop for styling and spacing. Reach for `Box`, `Stack`, or `Grid` before crafting custom layout code.
- Import components directly from `@mui/material`. Icons can be added via `@mui/icons-material` if the dependency is declared.

## Frontend workflows
- Use pnpm scripts from `frontend/`:
	- `pnpm install --frozen-lockfile --silent`
	- `pnpm run --silent dev`
	- `pnpm run --silent build`
	- `pnpm run --silent preview`
- TypeScript configuration is centralized in `tsconfig.app.json`; keep source files inside `src/`.

## Frontend good practices
- Start with a flat `src/` tree, then promote components into feature folders as they grow; collocate tests, styles, hooks, and types with each component so its public API stays focused while implementation details remain private.
- Reach for MUI's `sx` prop for single-use tweaks and escalate to `styled()` helpers or theme overrides when patterns repeat; never target global state class names without a component selector to avoid leaking styles across the app.
- Hoist shared `GlobalStyles` definitions and other heavy configuration objects outside component bodies so they are instantiated once per module rather than on every render.
- Prefer React Testing Library with Vitest for interaction-focused tests, and keep fixtures alongside the feature they exercise to reinforce the co-location model.

## Backend quick facts
- A local Django 5.2 service remains in `backend/` (project `config`, app `studio`). Use `uv sync --python 3.11` to install dependencies; the virtualenv sits at `backend/.venv`.
- Primary commands (prefix with `uv run`):
	- `python manage.py migrate`
	- `python manage.py runserver`
	- `python manage.py test`
	- `python manage.py spectacular --file schema.yaml`
- No frontend API client is bundled today, but the backend endpoints (`/api/library/`, `/api/editor/`, `/api/schema/`) are still available for future integrations.

## Frontend ↔ Backend bridge
- If you add API calls, centralize fetch logic in a dedicated module (e.g., `src/api/client.ts`) so base URLs and headers remain consistent.
- Default API origin should stay configurable via `VITE_API_URL` in `.env.local`.
- Share types between backend and frontend via generated files if the API surface grows again.

## Assumptions
- Backend and frontend run locally on their default ports when integration work resumes.
- Keep new dependencies lean; prefer Material UI primitives and built-in React patterns before pulling additional libraries.


## Repository layout snapshot

```
/backend
├── config/
├── studio/
├── db.sqlite3
├── manage.py
├── pyproject.toml
├── schema.yaml
└── uv.lock
/frontend
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```