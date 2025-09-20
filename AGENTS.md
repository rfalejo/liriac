# Repository Guidelines

## Project Structure & Module Organization
- `backend/` holds the Django project (`liriac/`) plus feature apps under `backend/apps/` (e.g., `autosave`, `library`) and pytest suites in `backend/tests/`.
- `frontend/` is a Vite + React workspace; shared API DTOs live in `frontend/src/api/types.ts` and UI state sits under `frontend/src/features/`.
- `docs/` captures architectural notes, while the root `Makefile` orchestrates backend and frontend workflows.
- Contract artifacts (`backend/schema.yaml` and generated TypeScript types) must always be updated together.

## Build, Test, and Development Commands
- `uv sync --all-extras` installs backend dependencies; run from `backend/` the first time.
- `make dev` launches Django and the Vite dev server concurrently; add `ARGS="0.0.0.0:8000"` to bind externally.
- `make check` runs schema regeneration, formatting, linting, type-checking, tests, and a production frontend build for CI parity.
- `make schema` + `make fe-typegen` refresh the OpenAPI contract and regenerate `frontend/src/api/types.ts`; commit any diffs immediately.
- Frontend-only tasks use pnpm: `pnpm run dev`, `pnpm run build`, `pnpm run test` (Vitest), and `pnpm run lint`.

## Coding Style & Naming Conventions
- Python code follows Black (88 chars) and Ruff; prefer four-space indents, type hints, and module-level `snake_case`.
- Django apps use `CamelCase` models, `snake_case` services, and migrate files named by Django’s defaults.
- TypeScript sticks to strict typings, PascalCase React components, and co-locates hooks under `src/features/<domain>/`.
- Formatting is enforced via `make fmt` (Ruff fix + Black) and `pnpm run format` (Prettier 3 with Tailwind plugin).

## Testing Guidelines
- Backend tests live near the Django apps and follow `test_*.py`; run `make test` or `make cov` for coverage (`pytest --cov`). Keep async tests using `pytest.mark.asyncio`.
- Frontend tests live under `frontend/src` and mirror component folders. Use descriptive `*.test.tsx` names; run `pnpm run test` for headless runs.
- Always trigger `make contract-check` before pushing API changes to catch schema drift early.

## Commit & Pull Request Guidelines
- The repository uses Conventional Commits (`feat:`, `fix:`, `style:`). Scope optional but encouraged (`feat(auth): ...`).
- Each PR should summarize intent, link to tracking issues, and list schema or UI changes. Attach screenshots/GIFs for visual tweaks.
- Verify `make check` passes before requesting review; include regenerated contract files and migration scripts in the same PR.
- Limit PRs to a focused unit of work; call out follow-ups and manual testing steps in the description.
