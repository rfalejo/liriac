---
applyTo: **
description: Comprehensive guide to Liriac's architecture, state management, and development workflows for AI agents.
---

# Liriac – AI agent quickstart

## Architecture snapshot
- The repo currently ships only the Vite/React SPA in `frontend/`; backend targets mentioned in docs are placeholders. Treat data as local mocks until the Django service lands.
- Entry flow: `src/main.tsx` → `App.tsx` → `EditorPage.tsx`, which stitches together `TopAppBar`, `EditorSurface`, `Settings`, `FooterStatusBar`, and global `Toasts` inside `ThemeProvider`.
- Global styles live in `src/index.css` and depend on the `data-theme` attribute set by `theme/ThemeContext.tsx`; stick to these CSS variables instead of hard-coding colors.

## Editor surface contracts
- `EditorSurface.tsx` owns the textarea, keeps focus when modals close, and wires keyboard access. Respect its `disabled` prop when the settings sheet is open.
- Smart punctuation (`useSmartPunctuation`) replaces straight quotes/dashes on each `input` event and is expected to show a one-time toast: call `showSmartToastOnce()` if you reuse the transform.
- Scrolling and navigation helpers (`utils/caret.ts`, `utils/scenes.ts`) keep the caret ~40% from the top and support scene jumps via "***" separators. Use them instead of rolling your own scrolling logic.

## Command palette & shortcuts
- `useEditorShortcuts` opens the command palette with `Ctrl/Cmd + .` or `/` at line start and recenters the caret after nav keys. Extend shortcut behavior there so focus/scroll rules stay consistent.
- `CommandBar.tsx` + `useCommandPalette` handle history (localStorage `liriac:cmdHistory`), autocomplete tails, and execution. New commands must be registered in `commands/commands.ts` and implemented through `executeCommand` using the provided textarea helpers.

## State management & persistence
- Zustand store (`store/appStore.tsx`) holds three slices: `editor`, `ui`, and `context`. It persists **only** the context slice (`partialize`) to localStorage key `liriac-store`; bump `version` and update the `migrate` function whenever the stored shape changes.
- Context data is seeded from `data/contextMock.ts` and mutated via pure helpers in `utils/sections.ts`. Keep these helpers side-effect free to preserve time-travel/devtools support.
- Toasts are limited to two concurrent messages and auto-dismiss after 2.5s. Use `ui.showToast` rather than managing local snackbars.

## Context editor workflow
- `components/Settings.tsx` wraps the dialog (`SettingsDialog`) and the context tab. Keyboard trapping relies on `useDialogFocusNav`; hook new panels into its `data-panel` structure so arrow/tab navigation keeps working.
- Item modals (`ItemEditorModal.tsx`) estimate token budget via `mockTokenize`. Maintain those estimates when adding new fields so `ContextTokenBar` reflects accurate totals.
- `useContextModals` is the single source of truth for modal open/edit state—extend it when introducing new context item types.

## Tooling & workflows
- Stick to direct pnpm scripts from `frontend/`; the root `Makefile` has been removed.
- Quiet commands that agents should prefer:
	- `pnpm install --frozen-lockfile --silent`
	- `pnpm run --silent dev`
	- `pnpm run --silent lint`
	- `pnpm run --silent typecheck`
	- `pnpm run --silent test`
	- `pnpm run --silent build`
- Tailwind 4 is configured via the `@tailwindcss/postcss` plugin chain. Author styles with the provided utility classes or shared CSS variables; avoid legacy `tailwind.config.js` patterns.
- Architectural background, backlog, and conventions live in `docs/` (`01-technical-spec-en.md`, `03-conventions.md`). Align new work with those docs even if some backend pieces are still theoretical.

Let me know if any part of this guide feels thin or unclear so I can refine it.