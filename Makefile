SHELL := bash
.ONESHELL:
.DEFAULT_GOAL := help

UV ?= uv
PYTHON ?= python3.11

PKG := liriac
SRC := src tests

# Colors for help
CYAN := \033[36m
NC := \033[0m

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  $(CYAN)%-18s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: venv
	$(UV) venv

.PHONY: sync
sync: ## Install/resolve dependencies (use --all-extras)
	$(UV) sync --all-extras

.PHONY: upgrade
upgrade: ## Upgrade dependencies to latest compatible
	$(UV) sync --all-extras -U

.PHONY: run
run: ## Run the CLI (use ARGS="--path .")
	$(UV) run $(PKG) $(ARGS)

.PHONY: fmt
fmt: ## Auto-format: ruff --fix + black
	$(UV) run ruff check --fix $(SRC)
	$(UV) run black $(SRC)

.PHONY: lint
lint: ## Lint only (no changes)
	$(UV) run ruff check $(SRC)
	$(UV) run black --check $(SRC)

.PHONY: typecheck
typecheck: ## Type-check with mypy --strict
	$(UV) run mypy --strict src tests

.PHONY: test
test: ## Run tests (pytest)
	$(UV) run pytest -q

.PHONY: cov
cov: ## Tests with coverage report
	$(UV) run pytest --cov=$(PKG) --cov-report=term-missing

.PHONY: check
check: ## Lint + typecheck + tests (CI-friendly)
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test

.PHONY: build
build: ## Build wheel/sdist via uv
	$(UV) build

.PHONY: clean
clean: ## Remove caches and build artifacts
	rm -rf .mypy_cache .pytest_cache .ruff_cache
	rm -rf build dist *.egg-info
	find . -type d -name "__pycache__" -prune -exec rm -rf {} +
	find . -type f -name "*.py[co]" -delete
