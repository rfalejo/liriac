---
description: 'liriac - AI agent quickstart'
applyTo: '**'
---
# Liriac – AI agent quickstart

## Frontend architecture
- React 18 + Vite lives in `frontend/`; the app renders through `src/main.tsx`, which wraps `<App />` in `LibraryDataProvider` to initialise React Query and shared library state.
- `features/library` owns the dashboard and data orchestration; `features/editor` contains the chapter editor surface and its hooks.
- API requests sit in `src/api/`. Use the `request()` helper in `client.ts` so base URLs and headers stay consistent. Generated OpenAPI types are committed in `src/api/schema.ts`.
- The design system is powered by Material UI. `App.tsx` already includes `ThemeProvider` + `CssBaseline`, and the custom palette/types live in `theme.ts` and `theme.types.ts`.
- When new frontend dependencies are required, prefer CLI commands such as `pnpm add <package>` (and `pnpm add -D <package>` for dev dependencies) rather than editing `package.json` manually.

## Adding or extending frontend features
1. Define or update the data contract.
   - Add request helpers next to existing modules in `src/api/` and keep them typed. When backend schemas change, regenerate types with `pnpm generate:types` and commit the updated `schema.ts`.
2. Introduce a query hook.
   - Extend `libraryQueryKeys` (or create a sibling `queryKeys` module) and build a hook with React Query. Prefer the shared `useLibraryResource` pattern for read flows so loading/error handling matches the rest of the UI.
3. Share state through the provider when multiple surfaces rely on it.
   - Extend `LibraryDataContext` and `LibraryDataProvider` so downstream components can consume memoised values like `reload` handlers, selections, and editor state.
4. Compose the UI inside the feature folder.
   - Keep layout and presentational logic in `components/` files, delegating data/side effects to hooks. Follow the existing pattern of container components (e.g. `LibraryLanding`, `EditorContainer`) that wire hooks together.
5. Handle mutations with explicit cache updates.
   - Wrap server writes in `useMutation`. Update cached data via `setQueryData` where possible and invalidate related queries to keep derived lists in sync. Route failures through `showBlockUpdateErrorToast` or a feature-specific message.

## Editor feature patterns
- `EditorContainer` is the orchestration layer; it combines navigation (`useEditorChapterNavigation`), scroll state, and editing state before rendering `EditorShell`.
- Blocks are rendered through `blocks/blockRegistry.tsx`. When adding a new block type, update the `ChapterBlock` typing, register the renderer, and supply editing logic through the hooks in `hooks/editing/`.
- Editing state is centralised in `useEditorEditingState` and block-specific sessions; reuse these utilities so undo/redo, pending changes, and confirmation prompts continue to work.
- Mutations that touch chapter content should flow through `useUpdateChapterBlock` so cache invalidation and optimistic state remain consistent.

## Styling and copy guidelines
- Use the `sx` prop for one-off adjustments; rely on theme tokens defined in `theme.ts` for repeated styling. Extend tokens there and mirror the TypeScript declaration in `theme.types.ts` to keep IntelliSense accurate.
- UI copy stays in Spanish. Code (identifiers, comments, errors) remains in English.
- `index.css` is intentionally minimal; avoid introducing global selectors unless absolutely necessary.

## Tooling and verification
- Run `pnpm install` once per environment. Use `pnpm dev` for local development.
- Quality gates from `frontend/`: `pnpm lint`, `pnpm typecheck`, and `pnpm build`. Run them before shipping meaningful changes.
- Format with `pnpm format` if the formatter reports differences. There is no automated frontend test suite yet, so rely on type coverage and manual verification.
- Every code task must conclude by running lint (and lint fix if necessary), the corresponding typecheck, and preparing a commit message summary for the changes. Scope the commands to `frontend/` or `backend/` based on the surface that was modified.

## Things to avoid (frontend)
- Skipping React Query hooks in favour of ad-hoc `fetch` calls; this breaks cache coherence and shared loading states.
- Bypassing `LibraryDataContext` for cross-surface state; duplicate state quickly drifts out of sync.
- Introducing global CSS overrides or inline styles that ignore theme tokens; they fight the design system and dark theme.
- Creating large, stateful components that mix data fetching, layout, and logic instead of composing hooks + presentational parts.
- Adding libraries for conveniences already solved by React Query, MUI, or existing utilities without prior review.

## Backend reference
- Django 5.2 lives under `backend/` with the `config` project and `studio` app. Manage dependencies via `uv sync --python 3.11`; the virtual environment is stored in `backend/.venv`.
- Common commands run through `uv run`: `python manage.py migrate`, `python manage.py test studio`, `python manage.py runserver`, and `python manage.py spectacular --file schema.yaml`.
- Never edit `backend/schema.yaml` or `frontend/src/api/schema.ts` by hand-regenerate them with `uv run python manage.py spectacular --file schema.yaml` and `pnpm generate:types`.
- Add backend dependencies using `uv add <package>` (or `uv add --dev <package>` for development-only needs). Avoid editing `pyproject.toml` by hand so lockfiles stay consistent.
- Keep Python style aligned with `ruff` and `black`. Use `uv run ruff check .` to lint and `uv run black .` (or `--check`) to format before shipping backend changes.

## Things to avoid (backend)
- Editing generated or migrated files by hand-use Django management commands or regenerate artefacts cleanly.
- Diverging the schema from `schema.yaml` without updating and committing the OpenAPI source; the frontend relies on those contracts.
- Adding dependencies outside `pyproject.toml` or bypassing `uv sync`, which leads to desynchronised environments.
- Introducing blocking I/O or heavy logic inside middleware without profiling; the project serves both API and editor traffic.
- Returning payloads that drift from the typed responses consumed in `frontend/src/api/`; always coordinate data shape changes.

## Collaboration rules
- Respond to users in English regardless of the incoming language.
- Keep comments and identifiers in English while UI text remains Spanish.
- Commit messages must be in English.

## Commit message guidelines
At the end of your work, provide a concise commit message summarising the changes made. Follow these guidelines:
- Use the conventional commit format: `<type>(<scope>): <subject>`.
- Add two or three bullet points in the commit body to explain what was done and why.
- Supported types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, etc.
- Example:
```
feat(library): add book listing endpoint
- Implement /api/library/books/ to return the available titles.
- Refresh the library landing page to consume the new endpoint.
- Cover the data flow with a React Query integration test.
```

## Tools
When planning a big change, you can use the following tools:
- `context7/*`: fetch up-to-date information about external libraries or frameworks.

## File handling
- If you want to delete a file, do not try to do so using the `edit` or `apply_patch` tools, instead, use the `rm` command in the terminal.
- If you want to rewrite a file completely, do not try to do so using the `edit` or `apply_patch` tools, instead, empty the file using the `echo '' > path/to/file` command in the terminal, and then you can use the built-in tools again to write to the file.

## Repository layout snapshot

```
.github/
\-- instructions/
    \-- liriac-coder.instructions.md
backend/
|-- config/
|   |-- __init__.py
|   |-- asgi.py
|   |-- settings.py
|   |-- urls.py
|   \-- wsgi.py
|-- studio/
|   |-- data/
|   |   |-- __init__.py
|   |   |-- blocks.py
|   |   |-- books.py
|   |   |-- bootstrap.py
|   |   |-- chapters.py
|   |   |-- context.py
|   |   \-- editor.py
|   |-- migrations/
|   |   |-- 0001_initial.py
|   |   |-- 0002_load_sample_data.py
|   |   |-- 0003_book_context_scope.py
|   |   |-- 0004_alter_librarysection_options.py
|   |   \-- __init__.py
|   |-- prompts/
|   |   |-- __init__.py
|   |   \-- paragraph_suggestion.py
|   |-- services/
|   |   |-- __init__.py
|   |   \-- gemini.py
|   |-- views/
|   |   |-- __init__.py
|   |   |-- chapters.py
|   |   |-- editor.py
|   |   |-- library.py
|   |   |-- suggestions.py
|   |   \-- utils.py
|   |-- __init__.py
|   |-- admin.py
|   |-- apps.py
|   |-- middleware.py
|   |-- models.py
|   |-- payloads.py
|   |-- sample_data.py
|   |-- serializers.py
|   |-- tests.py
|   \-- urls.py
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
|   |   |   |   |   |-- BlockEditControls.tsx
|   |   |   |   |   |-- DialogueEditableField.tsx
|   |   |   |   |   |-- EditableBlock.tsx
|   |   |   |   |   |-- EditableContentField.tsx
|   |   |   |   |   |-- EditableDialogueTurn.tsx
|   |   |   |   |   |-- MetadataEditView.tsx
|   |   |   |   |   \-- MetadataReadView.tsx
|   |   |   |   |-- utils/
|   |   |   |   |   \-- blockEditingHelpers.ts
|   |   |   |   |-- BlockInsertMenu.tsx
|   |   |   |   |-- DialogueBlock.tsx
|   |   |   |   |-- EditorBlockFrame.tsx
|   |   |   |   |-- MetadataBlock.tsx
|   |   |   |   |-- ParagraphBlock.tsx
|   |   |   |   |-- SceneBoundaryBlock.tsx
|   |   |   |   |-- blockRegistry.tsx
|   |   |   |   \-- index.ts
|   |   |   |-- chapter/
|   |   |   |   |-- ChapterBlockList.tsx
|   |   |   |   |-- ChapterEmptyState.tsx
|   |   |   |   |-- ChapterErrorState.tsx
|   |   |   |   |-- ChapterHeading.tsx
|   |   |   |   \-- ChapterLoadingState.tsx
|   |   |   |-- components/
|   |   |   |   \-- ConfirmationDialog.tsx
|   |   |   |-- context/
|   |   |   |   \-- EditorBlockEditingContext.tsx
|   |   |   |-- hooks/
|   |   |   |   |-- editing/
|   |   |   |   |   |-- constants.ts
|   |   |   |   |   |-- createBlockEditingState.ts
|   |   |   |   |   |-- types.ts
|   |   |   |   |   |-- useDialogueBlockEditingSession.ts
|   |   |   |   |   |-- useEditingBlockManager.ts
|   |   |   |   |   |-- useMetadataBlockEditingSession.ts
|   |   |   |   |   |-- useParagraphBlockEditingSession.ts
|   |   |   |   |   \-- useSceneBoundaryBlockEditingSession.ts
|   |   |   |   |-- useChapterBlockSelectors.ts
|   |   |   |   |-- useChapterBlocks.ts
|   |   |   |   |-- useCreateChapterBlock.ts
|   |   |   |   |-- useDeleteChapterBlock.ts
|   |   |   |   |-- useDialogueEditingState.ts
|   |   |   |   |-- useEditorChapterNavigation.ts
|   |   |   |   |-- useEditorConfirmDialog.ts
|   |   |   |   |-- useEditorEditingState.ts
|   |   |   |   |-- useEditorScrollbar.ts
|   |   |   |   |-- useMetadataEditingState.ts
|   |   |   |   |-- useParagraphEditingState.ts
|   |   |   |   |-- useSceneBoundaryEditingState.ts
|   |   |   |   |-- useSidebarHover.ts
|   |   |   |   \-- useUpdateChapterBlock.ts
|   |   |   |-- sidebar/
|   |   |   |   |-- SidebarChapterList.tsx
|   |   |   |   |-- SidebarHeader.tsx
|   |   |   |   \-- SidebarShell.tsx
|   |   |   |-- utils/
|   |   |   |   |-- blockCreation.ts
|   |   |   |   |-- dialogueTurns.ts
|   |   |   |   |-- editingShortcuts.ts
|   |   |   |   \-- showBlockUpdateErrorToast.ts
|   |   |   |-- EditorChapterView.tsx
|   |   |   |-- EditorContainer.tsx
|   |   |   |-- EditorShell.tsx
|   |   |   |-- EditorSidebar.tsx
|   |   |   \-- types.ts
|   |   \-- library/
|   |       |-- components/
|   |       |   |-- BookCoverCard.tsx
|   |       |   |-- BookDeleteDialog.tsx
|   |       |   |-- BookDialog.tsx
|   |       |   |-- BookEditorContextTab.tsx
|   |       |   |-- BookEditorMetadataTab.tsx
|   |       |   |-- BookEditorPanel.tsx
|   |       |   |-- ChapterDialog.tsx
|   |       |   |-- ConfirmDeleteDialog.tsx
|   |       |   |-- LibraryListItemButton.tsx
|   |       |   |-- LibraryPanel.tsx
|   |       |   |-- LibraryPanelStatus.tsx
|   |       |   |-- bookContextHelpers.ts
|   |       |   \-- panelStatus.ts
|   |       |-- hooks/
|   |       |   |-- useBookContextEditor.ts
|   |       |   |-- useBookDeletionFlow.ts
|   |       |   |-- useBookEditorPanel.ts
|   |       |   |-- useBookLookup.ts
|   |       |   |-- useBookMetadataForm.ts
|   |       |   |-- useChapterDetail.ts
|   |       |   |-- useCreateLibraryContextItem.ts
|   |       |   |-- useDeleteBook.ts
|   |       |   |-- useDeleteLibraryContextItem.ts
|   |       |   |-- useLibraryBooks.ts
|   |       |   |-- useLibraryEditor.ts
|   |       |   |-- useLibraryResource.ts
|   |       |   |-- useLibrarySections.ts
|   |       |   |-- useLibrarySelection.ts
|   |       |   |-- useUpdateLibraryContext.ts
|   |       |   |-- useUpsertBook.ts
|   |       |   \-- useUpsertChapter.ts
|   |       |-- LibraryBooksPanel.tsx
|   |       |-- LibraryChaptersDialog.tsx
|   |       |-- LibraryDataContext.tsx
|   |       |-- LibraryDataProvider.tsx
|   |       |-- LibraryLanding.tsx
|   |       \-- libraryQueryKeys.ts
|   |-- App.tsx
|   |-- index.css
|   |-- main.tsx
|   |-- theme.ts
|   |-- theme.types.ts
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