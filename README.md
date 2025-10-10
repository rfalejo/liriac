# Liriac

Linux TUI application for writing books with streaming AI assistance.

## Installation

```bash
uv sync --all-extras
```

## Development (frontend SPA available today)

```bash
cd frontend
pnpm install --frozen-lockfile --silent
pnpm run --silent dev           # Vite dev server
pnpm run --silent lint          # ESLint
pnpm run --silent typecheck     # tsc --noEmit
pnpm run --silent test          # Vitest
pnpm run --silent build         # Production bundle
```

## Backend (local Django API)

```bash
cd backend
uv sync --python 3.11           # create .venv with uv
uv run python manage.py migrate # apply initial migrations
uv run python manage.py runserver
```

### Update the OpenAPI schema & frontend types

```bash
cd backend
uv run python manage.py spectacular --file schema.yaml

cd ../frontend
pnpm run --silent generate:api
```