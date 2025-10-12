---
description: 'liriac - AI agent quickstart'
tools: ['runCommands', 'edit', 'search', 'context7/*', 'todos', 'usages', 'problems', 'changes', 'fetch']
model: GPT-5-Codex (Preview) (copilot)
---
# Liriac – AI agent quickstart

## Architecture snapshot
- The React app in `frontend/` owns both the library dashboard and the full-screen editor experience.
- Entry flow: `src/main.tsx` → `App.tsx`, where Material UI supplies theming, typography, and baseline layout.
- Feature folders (`features/library`, `features/editor`) co-locate hooks, components, and tests; `src/index.css` stays minimal so the theme controls visuals.

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
    - `pnpm run --silent typecheck` — `tsc --noEmit` for fast type safety.
    - `pnpm run --silent lint` — ESLint with `--max-warnings 0` across `src/**/*.{ts,tsx}`.
    - `pnpm run --silent format` — Prettier check.
- Verification flow: lint → typecheck → format. Rely on scripts instead of manual whitespace fixes.
- TypeScript configuration lives in `tsconfig.app.json`; keep application code inside `src/`.

## Frontend good practices
- Treat `features/library` and `features/editor` as primary seams; colocate hooks, tests, and helpers with each feature to keep APIs focused.
- Use the `sx` prop for one-off styling and move repeated patterns into theme overrides or `styled()` helpers; avoid global selectors that leak styles.
- Hoist shared configuration (query clients, theme constants, etc.) outside component bodies so they instantiate once per module.
- Prefer React Testing Library with Vitest for interaction coverage, storing fixtures with the feature they support.

## Backend quick facts
- Django 5.2 project lives in `backend/` (`config` project, `studio` app). Install dependencies with `uv sync --python 3.11`; the virtualenv resides in `backend/.venv`.
- Run common commands via `uv run`:
    - `python manage.py migrate`
    - `python manage.py runserver`
    - `python manage.py test`
    - `python manage.py spectacular --file schema.yaml`
- The frontend currently operates on mocked data, but REST endpoints such as `/api/library/` and `/api/editor/` are available when integration resumes.

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

## Tools
When planning a big change, you can use the following tools:
- `todos`: to create a list of tasks to be done. If your agentic flow involves code changes, you must make sure to ALWAYS include these tasks at the end of your todos list:
  - Run linter and typechecker
  - Run formatter
  - Generate a conventional commit message
- You can safely skip the previous tasks if your agentic flow does not involve code changes.
- `context7/*`: get up-to-date information about any library or framework.


## Repository layout snapshot

```
.github/
\-- chatmodes/
    \-- coder.chatmode.md
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
|   |   |-- chapters.ts
|   |   |-- client.ts
|   |   |-- library.ts
|   |   \-- schema.ts
|   |-- features/
|   |   |-- editor/
|   |   |   |-- blocks/
|   |   |   |   |-- components/
|   |   |   |   |   |-- DialogueEditableField.tsx
|   |   |   |   |   \-- EditableDialogueTurn.tsx
|   |   |   |   |-- BlockInsertMenu.tsx
|   |   |   |   |-- DialogueBlock.tsx
|   |   |   |   |-- EditorBlockFrame.tsx
|   |   |   |   |-- MetadataBlock.tsx
|   |   |   |   |-- ParagraphBlock.tsx
|   |   |   |   |-- SceneBoundaryBlock.tsx
|   |   |   |   \-- index.ts
|   |   |   |-- hooks/
|   |   |   |   |-- useEditorChapterNavigation.ts
|   |   |   |   |-- useEditorScrollbar.ts
|   |   |   |   |-- useSidebarHover.ts
|   |   |   |   \-- useUpdateChapterBlock.ts
|   |   |   |-- EditorChapterView.tsx
|   |   |   |-- EditorContainer.tsx
|   |   |   |-- EditorShell.tsx
|   |   |   |-- EditorSidebar.tsx
|   |   |   |-- editorTheme.ts
|   |   |   \-- types.ts
|   |   \-- library/
|   |       |-- components/
|   |       |   \-- LibraryPanelStatus.tsx
|   |       |-- hooks/
|   |       |   |-- useChapterDetail.ts
|   |       |   |-- useLibraryBooks.ts
|   |       |   |-- useLibraryEditor.ts
|   |       |   |-- useLibraryResource.ts
|   |       |   |-- useLibrarySections.ts
|   |       |   \-- useLibrarySelection.ts
|   |       |-- LibraryBooksPanel.tsx
|   |       |-- LibraryChaptersPanel.tsx
|   |       |-- LibraryContextPanel.tsx
|   |       |-- LibraryDataContext.tsx
|   |       |-- LibraryDataProvider.tsx
|   |       |-- LibraryLanding.tsx
|   |       \-- libraryQueryKeys.ts
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