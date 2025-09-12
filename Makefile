# Project helper targets
# Tools: pytest for tests, ruff for lint/format, mypy for types, pyright for types.

PYTEST ?= pytest
RUFF ?= python -m ruff
PYRIGHT ?= pyright

.DEFAULT_GOAL := help

.PHONY: help test lint format typecheck pyright clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Available targets:\n"} /^[a-zA-Z0-9_\/-]+:.*##/ { printf "  %-16s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

test: ## Run test suite with coverage
	$(PYTEST) --cov=liaric --cov-report=term-missing

lint: ## Run Ruff lint checks
	$(RUFF) check .

format: ## Format code with Ruff
	$(RUFF) format

pyright: ## Run Pyright type checks
	$(PYRIGHT)

typecheck: ## Run mypy on the project
	mypy liaric

fix: ## Fix issues found by the linters and type checkers
	$(RUFF) format
	mypy --install-types --non-interactive liaric
	mypy --check-untyped-defs liaric

clean: ## Remove cache artifacts
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@rm -rf .pytest_cache .mypy_cache .ruff_cache .pyrightcache