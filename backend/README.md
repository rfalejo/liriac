# Liriac

Linux TUI application for writing books with streaming AI assistance.

## Installation

```bash
uv sync --all-extras
```

## Development

```bash
make fmt          # Format code
make lint         # Lint code
make typecheck    # Type check
make test         # Run tests
make check        # Full CI pipeline
```

## OpenAPI Schema & Type Generation

The REST API contract is generated via DRF Spectacular and committed to `backend/schema.yaml`. Frontend TypeScript DTOs are generated from this schema into `frontend/src/api/types.ts`.

Workflow:

```bash
make schema       # regenerate backend/schema.yaml
make fe-typegen   # generate frontend/src/api/types.ts from schema
```

Contract drift detection runs inside `make check` (and can be invoked directly with `make contract-check`). If regenerating the schema or types produces a diff, commit the updated files.

Acceptance expectations:
- `backend/schema.yaml` stays in sync with implemented endpoints.
- `frontend/src/api/types.ts` compiles under strict TypeScript.
- PRs that change API shapes must regenerate both artifacts.