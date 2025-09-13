# liriac — Technical Stack v0.3 (Linux • Python 3.11 • Zero‑step Run)

## Targets

* **OS:** Linux only.
* **Python:** 3.11.x (hard requirement).
* **Encoding:** UTF‑8.

## Tooling choice

**Primary:** `uv` (fast resolver, creates and manages `.venv`, one‑command run). **Fallback:** stdlib `venv` + `pip` if `uv` is missing.

Rationale: `uv` enables “clone and run” without manual environment steps. Fallback keeps zero‑install constraints.

## Project files added

### `pyproject.toml` (minimal; no packaging publish implied)

```toml
[project]
name = "liriac"
version = "0.0.0"
requires-python = "==3.11.*"
dependencies = [
  "prompt_toolkit>=3,<4"
]

[project.scripts]
liriac = "liriac.cli:main"
```

> Note: We still support `python -m liriac`. The script entry allows `uv run liriac` if preferred.

### `requirements.txt` (for pip fallback)

```
prompt_toolkit>=3,<4
```

### `run` (executable launcher)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Require Python 3.11
if ! command -v python3.11 >/dev/null 2>&1; then
  echo "Python 3.11 is required." >&2
  exit 1
fi

if command -v uv >/dev/null 2>&1; then
  # Use uv-managed venv transparently
  exec uv run -q python -m liriac "$@"
else
  # Fallback: local venv + pip
  if [ ! -d .venv ]; then
    python3.11 -m venv .venv
    source .venv/bin/activate
    python -m pip install -U pip
    python -m pip install -r requirements.txt
  else
    source .venv/bin/activate
  fi
  exec python -m liriac "$@"
fi
```

## User experience (clone → run)

```bash
# Linux
git clone <repo>
cd liriac
chmod +x run
./run            # opens editor in current dir
./run init       # scaffolds current dir
```

* If `uv` is present: it resolves deps and runs immediately, creating `.venv/` as needed.
* If not: script creates `.venv/` and installs via `pip` once.

## CI/dev parity

* Local dev and CI both run `./run` to ensure parity.
* Optional: `./run test` routes to `pytest` via `uv run` or venv.

## Notes and trade‑offs

* Pinning: we can later add `uv.lock` for reproducibility. Omitted for now to stay minimal.
* No global install required; the repo stays self‑contained.
* If the user has multiple Pythons, the script enforces 3.11.

## Documentation snippet (README)

```
Requirements: Linux, Python 3.11. Optional: uv (faster).
Usage: clone, cd, chmod +x run, then ./run
```