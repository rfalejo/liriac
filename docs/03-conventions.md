# Liriac — Day-to-Day Checklist

Status: Recommended (MVP), Python 3.12+, TypeScript (strict), strongly typed.

- Types: Python `mypy --strict`; TypeScript `strict` (no implicit any); shared DTOs from OpenAPI.
- Structure: SPA presentation-only; Backend validates use cases; Domain pure; Services via Ports; Infra implements.
- IDs/Flags/Dicts: use `NewType`, `Literal`, `TypedDict` where appropriate.
- Interfaces: prefer `Mapping`/`Sequence`/`Iterable`; use `Protocol` for pluggable behavior.
- Exceptions: use app-specific errors; fail fast; no bare `Exception`.
- Immutability: use `tuple` when data shouldn’t change.
- Async/IO: frontend uses fetch/WebSockets; backend async for network/DB; set timeouts; honor cancellation; don’t block the loop.
- Logging: JSON via backend logging; no `print`; redact secrets and user content; frontend logs minimal non-PII (Sentry optional).
- Config: backend via env settings; frontend via `.env.local` (Vite); precedence: env > config file > defaults.
- Files/Paths: persisted in SQLite via Django models; no app-managed file paths or per-host file locks.
- Serialization: JSON over REST and WebSockets; UTF-8 `\n`.
- SPA: no business logic in components; server state in React Query; view state in Zustand; components are presentational-first.
- Testing: frontend: Vitest + RTL + Playwright; backend: pytest + DRF + Channels; provider/network mocked; no real external calls.
- Testing policy: tests-first; write/modify tests in the same PR as code; Definition of Done requires code + tests + docs.
- Contract checks: regenerate OpenAPI and re-run typegen on schema changes; fail CI on drift between backend schema and generated TS types.
- CI gating: lint, typecheck, and tests must pass before merge.
- Performance: stream AI output; avoid repeated large string builds; snapshot only if diff ≥ 100 chars.
- Imports/Naming: stdlib → third-party → local; absolute imports; conventional names; define `__all__` when needed.
- Lint/Format: backend `ruff --fix` and `black .`; frontend `eslint` and `prettier --write`.
- Type Check: run `mypy --strict` and `tsc --noEmit`; avoid `cast()` unless justified.
- Tools: use `uv` (env, deps, `uv run`) and `pnpm` (dev, build, test).
- Makefile: run backend and frontend tasks; includes `fe-*` targets and common `fmt`, `lint`, `typecheck`, `test`, `check`, `build`, `clean`.
