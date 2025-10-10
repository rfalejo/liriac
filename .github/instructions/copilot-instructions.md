---
applyTo: **
description: Comprehensive guide to Liriac's architecture, state management, and development workflows for AI agents.
---

# Liriac – AI agent quickstart

## Architecture snapshot
- The repo currently ships only the Vite/React SPA in `frontend/`.
- Entry flow: `src/main.tsx` → `App.tsx` → `EditorPage.tsx`, which stitches together `TopAppBar`, `EditorSurface`, `Settings`, `FooterStatusBar`, and global `Toasts` inside `ThemeProvider`.
- Global styles live in `src/index.css` and depend on the `data-theme` attribute set by `theme/ThemeContext.tsx`; stick to these CSS variables instead of hard-coding colors.

## Editor surface contracts
- `EditorSurface.tsx` owns the textarea, keeps focus when modals close, and wires keyboard access. Respect its `disabled` prop when the settings sheet is open.
- Smart punctuation (`useSmartPunctuation`) replaces straight quotes/dashes on each `input` event and is expected to show a one-time toast: call `showSmartToastOnce()` if you reuse the transform.
- Scrolling and navigation helpers (`utils/caret.ts`, `utils/scenes.ts`) keep the caret ~40% from the top and support scene jumps via "***" separators. Use them instead of rolling your own scrolling logic.

## Command palette & shortcuts
- `useEditorShortcuts` opens the command palette with `Ctrl/Cmd + .` or `/` at line start and recenters the caret after nav keys. Extend shortcut behavior there so focus/scroll rules stay consistent.
- `CommandBar.tsx` + `useCommandPalette` handle history (localStorage `liriac:cmdHistory`), autocomplete tails, and execution. New commands must be registered in `commands/commands.ts` and implemented through `executeCommand` using the provided textarea helpers.

## State management & persistence
- Zustand store (`store/appStore.tsx`) holds three slices: `editor`, `ui`, and `context`. It persists **only** the context slice (`partialize`) to localStorage key `liriac-store`; bump `version` and update the `migrate` function whenever the stored shape changes.
- Toasts are limited to two concurrent messages and auto-dismiss after 2.5s. Use `ui.showToast` rather than managing local snackbars.

## Context editor workflow
- `components/Settings.tsx` wraps the dialog (`SettingsDialog`) and the context tab. Keyboard trapping relies on `useDialogFocusNav`; hook new panels into its `data-panel` structure so arrow/tab navigation keeps working.
- Item modals (`ItemEditorModal.tsx`) estimate token budget via `mockTokenize`. Maintain those estimates when adding new fields so `ContextTokenBar` reflects accurate totals.
- `useContextModals` is the single source of truth for modal open/edit state—extend it when introducing new context item types.

## Tooling & workflows
- Stick to direct pnpm scripts from `frontend/`; the root `Makefile` has been removed.
- Quiet commands that agents should prefer:
	- `pnpm install --frozen-lockfile --silent`
	- `pnpm run --silent dev`
	- `pnpm run --silent lint`
	- `pnpm run --silent typecheck`
	- `pnpm run --silent test`
	- `pnpm run --silent build`
- Tailwind 4 is configured via the `@tailwindcss/postcss` plugin chain. Author styles with the provided utility classes or shared CSS variables; avoid legacy `tailwind.config.js` patterns.

## Backend quick facts
- A local-only Django 5.2 service lives in `backend/` (project `config`, app `studio`). Use `uv sync --python 3.11` to install dependencies; the virtualenv is created at `backend/.venv`.
- Primary commands (always prefixed with `uv run`):
	- `python manage.py migrate`
	- `python manage.py runserver`
	- `python manage.py test`
	- `python manage.py spectacular --file schema.yaml` (exports OpenAPI)
- REST endpoints available:
	- `GET /api/library/` → context sections (mirrors `INITIAL_SECTIONS` structure)
	- `GET /api/editor/` → textarea snapshot (`content`, `tokens`, `cursor`)
	- `GET /api/schema/` → OpenAPI 3.0 document, also served via `GET /api/docs/`
- Frontend types are generated from `backend/schema.yaml` with `pnpm run --silent generate:api` and stored in `frontend/src/api/schema.ts`. Regenerate after backend schema changes.
- The frontend API client reads `VITE_API_URL`; default is `http://localhost:8000`. Keep new endpoints consistent with that base URL.

## Frontend ↔ Backend bridge
- Start the Django server (`uv run python manage.py runserver`) before launching the Vite dev server so the SPA can hydrate with live data. The frontend defaults to `http://localhost:8000`, but you can override it with a `frontend/.env.local` entry like `VITE_API_URL=http://127.0.0.1:8000` when tunneling or running against a different host.
- `frontend/src/api/client.ts` centralizes all fetch logic. New API calls should be added there so they inherit the shared base URL, JSON headers, and error handling.
- On mount, `EditorPage.tsx` calls `fetchLibrary()` and `fetchEditor()` in parallel, then normalizes the payload into the Zustand store (`setSections`, `setInitialContent`, `setTokens`). This keeps the textarea and context panes in sync with the backend snapshot.
- If the API can’t be reached, the page logs the failure and shows a toast via `ui.showToast`. Make sure runtime errors surface this path to avoid silent failures.
- When adding endpoints that feed the editor, return shapes should align with the generated `components['schemas'][...]` types so the existing normalization helpers continue to work without manual casts.

## Assumptions
- Both the frontend and backend projects are running locally, they're reachable at their default ports, and CORS is properly configured. So you can run cURL commands at any time to inspect or mutate data.