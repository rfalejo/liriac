# Liriac

A minimal Vite + React frontend scaffold backed by a local Django API. The frontend now ships with Material UI out of the box.

## Project overview

- **Frontend**: `frontend/` contains a slim React app. The entry flow is `src/main.tsx` → `App.tsx`, where Material UI provides theming, baseline styles, and starter layout components.
- **Backend**: `backend/` still hosts the Django project (`config/`) and `studio` app. The current frontend does not call the API directly, but the backend remains available for future integrations.

## Getting started

### Backend (optional)

```bash
cd backend
uv sync --python 3.11
uv run python manage.py migrate
uv run python manage.py runserver
```

Run the server if you plan to extend the frontend with API calls at `http://localhost:8000`.

### Frontend

```bash
cd frontend
pnpm install --frozen-lockfile --silent
pnpm run --silent dev
```

Additional commands:

```bash
pnpm run --silent build   # Production bundle
pnpm run --silent preview # Preview the built assets
```

## Material UI basics

- Theme setup lives in `frontend/src/App.tsx` using `createTheme`, `ThemeProvider`, and `CssBaseline`.
- Add new UI elements by composing Material UI components. Import them directly from `@mui/material` and stick to the SX prop for styling.
- Global CSS is intentionally minimal (`frontend/src/index.css`) so Material UI can control typography and spacing.

## Repository layout snapshot

```
/backend            Django project (unused by default build)
/frontend
	├── index.html
	├── package.json
	└── src
			├── App.tsx
			├── index.css
			└── main.tsx
```