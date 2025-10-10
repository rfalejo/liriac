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