# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Liriac is a web-based writing environment for authoring books with AI assistance. It consists of:
- **Frontend**: React + TypeScript SPA with Vite, Tailwind CSS, and modern tooling
- **Backend**: Django REST Framework with WebSocket support via Django Channels
- **Architecture**: Local-only development tool with streaming AI suggestions and autosave functionality

## Development Environment

### Prerequisites
- Python 3.12+ with UV package manager
- Node.js 20+ with pnpm (or npm)
- SQLite (built-in)

### Setup
```bash
# Install backend dependencies
cd backend && uv sync --all-extras

# Install frontend dependencies
cd frontend && pnpm install
```

## Common Commands

### Backend (Django)
```bash
# Development server
make run                    # Start Django dev server
make migrate               # Run migrations
make makemigrations        # Create migrations
make shell                 # Django shell
make createsuperuser       # Create superuser

# Code quality
make fmt                   # Format code (ruff + black)
make lint                  # Lint code
make typecheck             # Type check with mypy
make test                  # Run tests
make cov                   # Tests with coverage

# Build and deployment
make build                 # Build wheel/sdist
make schema                # Generate OpenAPI schema
```

### Frontend (React)
```bash
# Development
make fe-dev                # Start Vite dev server
make fe-build              # Build for production

# Code quality
make fe-lint               # ESLint
make fe-typecheck          # TypeScript check
make fe-test               # Vitest tests

# Type generation
make fe-typegen            # Generate TS types from OpenAPI schema
```

### Combined Workflows
```bash
make dev                   # Run both frontend and backend dev servers
make check                 # Full CI pipeline (lint + typecheck + tests)
make clean                 # Remove caches and build artifacts
```

## Architecture Overview

### Project Structure
```
liriac/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── app/           # Entry point and routing
│   │   ├── components/    # Reusable components
│   │   ├── api/           # API clients and types
│   │   └── styles/        # Global styles
│   └── package.json
├── backend/               # Django backend
│   ├── apps/              # Django apps
│   │   ├── echo/          # WebSocket echo functionality
│   │   └── health/        # Health check endpoints
│   ├── liriac/            # Django project settings
│   └── manage.py
└── docs/                  # Technical documentation
```

### Key Technologies
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Vitest
- **Backend**: Django 5, Django REST Framework, Django Channels, pytest
- **Communication**: REST API + WebSockets for streaming
- **Database**: SQLite (no external dependencies)
- **Type Safety**: Strict TypeScript, mypy --strict, shared OpenAPI schema

### API Design
- REST endpoints under `/api/v1/`
- WebSocket namespace `/ws/` for streaming AI suggestions
- OpenAPI schema generated via DRF Spectacular
- No authentication required (local-only development)

### Core Features
1. **Book Management**: CRUD operations for books and chapters
2. **AI Suggestions**: Streaming AI assistance via WebSockets
3. **Autosave**: Automatic saving with checksum deduplication
4. **Context Management**: Persona and chapter selection for AI context

## Development Workflow

### Code Quality Standards
- **Backend**: ruff for linting, black for formatting, mypy --strict for type checking
- **Frontend**: ESLint, TypeScript strict mode, Prettier (if configured)
- **Testing**: pytest for backend, Vitest for frontend
- **Commits**: Conventional commits encouraged

### Type Safety
- Backend uses `mypy --strict` with comprehensive type annotations
- Frontend uses strict TypeScript with no implicit any
- Shared types generated from OpenAPI schema via `make fe-typegen`

### Testing
- Backend: pytest with Django test runner, factory-boy for fixtures
- Frontend: Vitest with Testing Library for component tests
- Integration: End-to-end tests can be added with Playwright

## Important Notes

- This is a **local-only development tool** - not designed for public deployment
- No authentication or authorization required
- All data stored in SQLite database
- WebSocket streaming for real-time AI suggestions
- Autosave functionality with content hash deduplication
- Strong typing enforced across the entire stack