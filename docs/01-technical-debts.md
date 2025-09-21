# Technical Debts and Improvements

This document tracks known technical debts and near-term quality improvements. It’s organized by priority, with brief rationale and acceptance criteria for each item.

Status
- Completed
  - Stage 1: Command execution wiring in EditorSurface (executeCommand, context open, scene break, goto).
  - Stage 2: Editor stats self-contained via input listener and initial emit; EditorSurface no longer manually calls update.
- Pending
  - Stages 3–9 below.

High priority
1) Performance: throttle caret/scroll work
- Problem: typewriterScroll and getCaretTop run on every input and can cause layout thrash in long documents.
- Action: wrap typewriterScroll calls in requestAnimationFrame and coalesce per frame (one scroll per element per frame).
- Acceptance: smooth typing at scale; no visible jumpiness.

2) Accessibility: focus trapping and labelling in SettingsDialog
- Problem: Dialog focus can escape; limited ARIA labelling.
- Action: add Tab focus trap to SettingsDialog (cycle within), aria-describedby on dialog content, ensure Esc closes.
- Acceptance: Tab never escapes the dialog when open; screen readers announce dialog with title/description.

Medium priority
3) Event bus hygiene and type-safety
- Problem: Stringly-typed CustomEvent names and payloads are error-prone.
- Action: add src/events.ts with EVT constants and typed emit helpers (emitToast, emitEditorCommand, emitEditorStats, emitContextOpen). Replace string literals across code.
- Acceptance: no raw event name strings in code; payloads typed at call sites.

4) Tests for core utilities and editor behaviors
- commandUtils: computeSuggestion (aliases, prefix), findCommand (exact label, alias).
- utils/scenes: getSceneOffsets (multiple breaks), gotoScene mapping, jumpToOffset edge bounds.
- hooks/useSmartPunctuation: “--” → “—”, opening/closing double and single quotes, contractions (don’t over-replace).
- utils/tokens: mockTokenize basic and edge cases.
- EditorSurface command flow: “insert scene break” mutates value and caret; emits editor:command.
- Acceptance: vitest passes; coverage over main branches.

5) Lint/TS rule tightening
- Add eslint-plugin-react-hooks and fix exhaustive-deps where needed.
- Add no-restricted-globals for event names (encourage EVT constants).
- Consider @typescript-eslint rules: consistent-type-definitions, explicit-module-boundary-types.
- Acceptance: eslint passes with stricter config; no warnings.

6) Stabilize handler identities
- Problem: Frequent inline function recreations can cause child re-renders.
- Action: wrap handlers passed to children (e.g., SettingsDialog’s onClose/onSave/onClear, CommandBar callbacks) with useCallback where beneficial.
- Acceptance: unnecessary re-renders reduced (verify via React DevTools).

Lower priority
7) State architecture for textarea
- Problem: Uncontrolled textarea with direct .value mutations; OK but couples logic to DOM.
- Options:
  - Keep uncontrolled but centralize all mutations and ensure stats/last-edit remain in sync (current approach).
  - Or migrate to controlled state with value + onChange (heavier; measure perf first).
- Acceptance: documented decision; no regressions in token stats or caret behavior.

8) UX polish and discoverability
- CommandBar placeholder/hints: “Type a command… (/ to open)”.
- Footer hint for palette: “Cmd/Ctrl+.”.
- Prefill “/” on palette open via “/” (done); consider keeping it visible in placeholder.
- Acceptance: shortcuts discoverable without docs.

9) Extract magic numbers and constants
- Centralize: TOKEN_BUDGET=2000, TYPEWRITER_RATIO=0.4, TYPEWRITER_STEP=120, TOAST_TTL=2500, TOAST_MAX=2.
- Acceptance: constants live in src/constants.ts; all usages replaced.

10) Consistency and small components
- Extract checkbox style used in ContextSectionList and ContextStyleTonePanel into a tiny shared Checkbox component if list grows.
- Acceptance: fewer duplicated class strings; shared behavior for accessibility.

Notes
- Keep window event approach for now to limit scope; the typed events helper will mitigate risks.
- Defer conversion of dialogs to a headless UI library; current custom logic suffices once focus trap added.

Tracking
- Use this file to check off items as they’re delivered and to add new debts discovered during development or review.
