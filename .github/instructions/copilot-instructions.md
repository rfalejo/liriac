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
	- `pnpm run --silent typecheck` — runs `tsc --noEmit` for fast type enforcement.
	- `pnpm run --silent lint` — executes ESLint with `--max-warnings 0` across `src/**/*.{ts,tsx}`.
	- `pnpm run --silent format` — checks repository formatting with Prettier.
	- Formatting is automated; run `pnpm run --silent format` after your changes instead of hand-tweaking whitespace so you can stay focused on feature work.
	- Don’t burn cycles on linting or formatting chatter in responses—use the scripts when you truly need a signal and keep the conversation anchored on functionality.
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

## Material UI + TypeScript quick references
- Always nest components that consume `useTheme`, `makeStyles`, or `styled` hooks under the shared `ThemeProvider` defined in `App.tsx`; call styling hooks inside children of the provider to avoid undefined theme values.
- When extending the theme in TypeScript (e.g., custom palette slots or breakpoints), augment the MUI module so IntelliSense and type checking stay accurate:
	```ts
	import { Theme } from '@mui/material/styles';

	declare module '@mui/styles/defaultTheme' {
		interface DefaultTheme extends Theme {}
	}

	declare module '@mui/material/styles' {
		interface BreakpointOverrides {
			xs: false;
			sm: false;
			md: false;
			lg: false;
			xl: false;
			mobile: true;
			tablet: true;
			laptop: true;
			desktop: true;
		}
	}
	```
- For project-wide TypeScript safety after touching Material UI theme types or declarations, run `pnpm typescript` from the `frontend/` directory to validate generated `.d.ts` output.

## User interaction notes
- Even if the user interacts to you in a different language, respond in English.
- All the code you write must be in English, but use Spanish for UI labels and text content.
- Commit messages must be in English.
- Comments should be in English.

## Commit message guidelines
At the end of your work, provide a concise commit message summarizing the changes made. Follow these guidelines:
- Use the conventional commit format: `<type>(<scope>): <subject>`.
- Add two/three bullet points in the commit body to explain what was done and why.
- Use the following types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, etc.
- Example:
```
feat(library): add book listing endpoint
- Implemented /api/library/books/ to return a list of books in the library.
- Updated frontend to fetch and display books on the library landing page.
- Added tests to cover the new endpoint and frontend integration.
```


## Repository layout snapshot

```
.github/
\-- instructions/
    \-- copilot-instructions.md
backend/
|-- config/
|   |-- __init__.py
|   |-- asgi.py
|   |-- settings.py
|   |-- urls.py
|   \-- wsgi.py
|-- studio/
|   |-- migrations/
|   |   \-- __init__.py
|   |-- __init__.py
|   |-- admin.py
|   |-- apps.py
|   |-- data.py
|   |-- middleware.py
|   |-- models.py
|   |-- serializers.py
|   |-- tests.py
|   |-- urls.py
|   \-- views.py
|-- manage.py
|-- pyproject.toml
|-- schema.yaml
\-- uv.lock
frontend/
|-- src/
|   |-- api/
|   |   |-- client.ts
|   |   |-- library.ts
|   |   \-- schema.ts
|   |-- features/
|   |   \-- library/
|   |       |-- LibraryLanding.tsx
|   |       |-- useLibraryBooks.ts
|   |       \-- useLibrarySections.ts
|   |-- App.tsx
|   |-- index.css
|   |-- main.tsx
|   \-- vite-env.d.ts
|-- .gitignore
|-- .prettierignore
|-- eslint.config.js
|-- index.html
|-- package.json
|-- pnpm-lock.yaml
|-- tsconfig.app.json
|-- tsconfig.json
|-- tsconfig.node.json
\-- vite.config.ts
scripts/
\-- generate_repo_tree.py
.gitignore
README.md
```