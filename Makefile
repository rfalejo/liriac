SHELL := bash
.ONESHELL:
.DEFAULT_GOAL := help

UV ?= uv
PYTHON ?= python3.12
PNPM ?= pnpm
FRONTEND_DIR ?= frontend
BACKEND_DIR ?= backend

PKG := liriac

# Colors for help
CYAN := \033[36m
NC := \033[0m

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  $(CYAN)%-18s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ------------------------
# Backend (Django + DRF)
# ------------------------
.PHONY: venv
venv: ## Create virtual environment
	cd $(BACKEND_DIR) && $(UV) venv

.PHONY: sync
sync: ## Install/resolve dependencies (use --all-extras)
	cd $(BACKEND_DIR) && $(UV) sync --all-extras

.PHONY: upgrade
upgrade: ## Upgrade dependencies to latest compatible
	cd $(BACKEND_DIR) && $(UV) sync --all-extras -U

.PHONY: run
run: ## Run Django development server
	cd $(BACKEND_DIR) && $(UV) run python manage.py runserver $(ARGS)

.PHONY: migrate
migrate: ## Run Django migrations
	cd $(BACKEND_DIR) && $(UV) run python manage.py migrate

.PHONY: makemigrations
makemigrations: ## Create Django migrations
	cd $(BACKEND_DIR) && $(UV) run python manage.py makemigrations

.PHONY: shell
shell: ## Open Django shell
	cd $(BACKEND_DIR) && $(UV) run python manage.py shell

.PHONY: createsuperuser
createsuperuser: ## Create Django superuser
	cd $(BACKEND_DIR) && $(UV) run python manage.py createsuperuser

.PHONY: schema
schema: ## Generate OpenAPI schema (DRF Spectacular)
	cd $(BACKEND_DIR) && $(UV) run python manage.py spectacular --file schema.yaml

.PHONY: fmt
fmt: ## Auto-format: ruff --fix + black (backend)
	cd $(BACKEND_DIR) && $(UV) run ruff check --fix . && $(UV) run black .

.PHONY: format
format: fmt fe-fmt ## Format backend (ruff+black) and frontend (Prettier)

.PHONY: lint
lint: ## Lint backend only (no changes)
	cd $(BACKEND_DIR) && $(UV) run ruff check . && $(UV) run black --check .

.PHONY: typecheck
typecheck: ## Type-check backend with mypy --strict
	cd $(BACKEND_DIR) && $(UV) run mypy --strict .

.PHONY: test
test: ## Run backend tests (pytest)
	cd $(BACKEND_DIR) && $(UV) run pytest -q

.PHONY: cov
cov: ## Backend tests with coverage report
	cd $(BACKEND_DIR) && $(UV) run pytest --cov=$(PKG) --cov-report=term-missing

.PHONY: build
build: ## Build backend wheel/sdist via uv
	cd $(BACKEND_DIR) && $(UV) build

# ------------------------
# Frontend (React + TS + Tailwind)
# ------------------------
.PHONY: fe-setup
fe-setup: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && $(PNPM) install

.PHONY: fe-dev
fe-dev: ## Run frontend dev server (Vite)
	cd $(FRONTEND_DIR) && $(PNPM) run dev $(ARGS)

.PHONY: fe-build
fe-build: ## Build frontend for production
	cd $(FRONTEND_DIR) && $(PNPM) run build

.PHONY: fe-lint
fe-lint: ## Lint frontend (ESLint)
	cd $(FRONTEND_DIR) && $(PNPM) run lint

.PHONY: fe-test
fe-test: ## Test frontend (Vitest)
	cd $(FRONTEND_DIR) && $(PNPM) run test

.PHONY: fe-typecheck
fe-typecheck: ## Type-check frontend (tsc --noEmit)
	cd $(FRONTEND_DIR) && $(PNPM) run typecheck

.PHONY: fe-fmt
fe-fmt: ## Format frontend (Prettier)
	cd $(FRONTEND_DIR) && $(PNPM) run format

.PHONY: fe-typegen
fe-typegen: schema ## Generate frontend TS types from OpenAPI schema
	cd $(FRONTEND_DIR) && $(PNPM) dlx openapi-typescript ../$(BACKEND_DIR)/schema.yaml -o src/api/types.ts

# ------------------------
# Combined workflows
# ------------------------
.PHONY: dev
dev: ## Run backend and frontend dev servers together
	cd $(BACKEND_DIR) && $(UV) run python manage.py runserver $(ARGS) & \
	cd $(FRONTEND_DIR) && $(PNPM) run dev

.PHONY: check
check: ## Lint + typecheck + tests for frontend and backend
	$(MAKE) format
	$(MAKE) fe-lint
	$(MAKE) fe-typecheck
	$(MAKE) fe-test
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test
	$(MAKE) fe-build

.PHONY: clean
clean: ## Remove caches and build artifacts
	rm -rf .mypy_cache .pytest_cache .ruff_cache
	rm -rf build dist *.egg-info
	find . -type d -name "__pycache__" -prune -exec rm -rf {} +
	find . -type f -name "*.py[co]" -delete
	cd $(BACKEND_DIR) && rm -rf .mypy_cache .pytest_cache .ruff_cache build dist *.egg-info
