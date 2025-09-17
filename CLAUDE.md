# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Liriac is a Linux TUI application for writing books with streaming AI assistance. The project consists of a Django + DRF backend with WebSocket support and a React + TypeScript frontend.

## Development Environment

### Prerequisites
- Python 3.12+
- Node.js 20+
- pnpm 8+ (or npm)
- uv (Python package manager)

### Initial Setup
```bash
# Install dependencies
uv sync --all-extras
cd frontend && pnpm install
```

## Common Development Commands

### Backend (Django)
```bash
make run              # Run Django development server
make migrate          # Run Django migrations
make makemigrations   # Create Django migrations
make shell           # Open Django shell
make createsuperuser # Create Django superuser
make schema          # Generate OpenAPI schema
```

### Frontend (React + TypeScript)
```bash
make fe-setup        # Install frontend dependencies
make fe-dev          # Run frontend dev server
make fe-build        # Build frontend for production
make fe-fmt          # Format frontend code with Prettier
```

### Code Quality
```bash
make fmt             # Format code (ruff + black)
make lint            # Lint code (no changes)
make typecheck       # Type check (mypy + tsc)
make test            # Run tests
make check           # Full CI pipeline (lint + typecheck + tests)
pnpm -C frontend format       # (Alt) run Prettier write in frontend
pnpm -C frontend format:check # (Alt) check formatting without writing
```

## Project Architecture

### Backend Structure
- **Django 5.2** with **Django REST Framework** for REST API
- **Django Channels** for WebSocket support
- **SQLite** database (no external dependencies)
- **DRF Spectacular** for OpenAPI schema generation

Key directories:
- `backend/apps/` - Django applications (health, echo, etc.)
- `backend/liriac/` - Django project configuration
- `backend/tests/` - Backend tests

### Frontend Structure
- **React 19.1.1** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Vitest** + Testing Library for testing

Key directories:
- `frontend/src/` - React components and application code
- `frontend/public/` - Static assets

### Key Integration Points
- REST API endpoints under `/api/v1/`
- WebSocket endpoints under `/ws/`
- OpenAPI schema generated at `backend/schema.yaml`
- Frontend types generated from OpenAPI schema

## Code Style and Conventions

### Python (Backend)
- **Line length**: 88 characters (ruff + black)
- **Type checking**: `mypy --strict`
- **Formatting**: ruff + black
- **Linting**: ruff with E, W, F, I, B, C4, UP rules
- **Testing**: pytest with Django support

### TypeScript (Frontend)
- **Type checking**: strict TypeScript (`tsc --noEmit`)
- **Formatting**: ESLint + Prettier
- **Linting**: ESLint with React-specific rules
- **Testing**: Vitest + Testing Library

## Development Workflow

### Making Changes
1. Create feature branch from main
2. Implement changes following the architecture patterns
3. Update tests
4. Run `make check` to ensure all quality checks pass
5. Commit with descriptive message

### API Changes
1. Update Django models/views
2. Regenerate OpenAPI schema: `make schema`
3. Generate frontend types: `make fe-typegen`
4. Update frontend API client if needed

### Testing
- Backend: `make test` (pytest)
- Frontend: `make fe-test` (Vitest)
- Combined: `make check`

## Architecture Principles

- **Strong typing**: Strict TypeScript on frontend, `mypy --strict` on Python
- **Modular boundaries**: SPA handles presentation only, Django exposes validated use cases
- **Streaming-first**: AI suggestions arrive incrementally over WebSockets
- **Idempotent persistence**: Autosave endpoints deduplicate writes via content hashes
- **Accessibility & performance**: Keyboard-first workflows, Tailwind utility styling
- **Observability**: Structured JSON logs, per-request tracing

## Current Implementation Status

The project is in early development with:
- Basic Django backend setup with health check and echo endpoints
- WebSocket support via Django Channels
- React frontend with TypeScript and Tailwind CSS
- Build and development tooling configured

## Important Notes

- Local-only development: No authentication required, runs on localhost
- No external dependencies: SQLite for database, in-memory channel layer
- Strong typing enforcement across the stack
- Shared OpenAPI schema for type safety between frontend and backend