# Liriac — Day-to-Day Checklist

Status: Recommended (MVP), Python 3.11+, strongly typed.

- Types: annotate everything; no implicit Any; pass `mypy --strict`.
- Structure: Domain pure; Services via Ports; Infra implements; TUI presentation-only.
- IDs/Flags/Dicts: use `NewType`, `Literal`, `TypedDict` where appropriate.
- Interfaces: prefer `Mapping`/`Sequence`/`Iterable`; use `Protocol` for pluggable behavior.
- Exceptions: use app-specific errors; fail fast; no bare `Exception`.
- Immutability: use `tuple` when data shouldn’t change.
- Async/IO: use async for network/disk; set timeouts; honor cancellation; don’t block the loop.
- Logging: JSON via infra logging; no `print`; redact secrets and user content.
- Config: only via settings adapter; precedence: CLI > env > config file > defaults.
- Files/Paths: use `pathlib.Path`; atomic writes; hash to skip unchanged; per-host file lock.
- Serialization: TOML with stdlib `tomllib` (read) and `tomli-w` (write); UTF-8 `\n`.
- TUI: no business logic in views; communicate via messages/events; persist minimal UI state.
- Testing: unit tests for Domain/Services; `httpx`+`respx` for Infra; Textual Pilot for TUI; no real network.
- Performance: stream AI output; avoid repeated large string builds; snapshot only if diff ≥ 100 chars.
- Imports/Naming: stdlib → third-party → local; absolute imports; conventional names; define `__all__` when needed.
- Lint/Format: run `ruff --fix` and `black .` before committing.
- Type Check: run `mypy --strict`; avoid `cast()` unless justified.
- Tools: use `uv` for env, deps, and `uv run` scripts.
- Makefile: run common tasks with `make` (venv, sync, fmt, lint, typecheck, test, check, build, clean).
