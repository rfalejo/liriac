# React Antipattern Audit – October 2025

This note documents the React antipatterns discovered in the current `main` branch and sketches remediation steps. Sources reference the shared playbook at `docs/react-mui-antipatterns.md`.

## Findings Overview

| Location | Antipattern | Symptom | Recommended Fix |
| --- | --- | --- | --- |
| `frontend/src/features/library/hooks/useBookContextEditor.ts` | Missing hook dependencies | Context save flag stays true after mutations because `useMemo` omits a ref dependency. | Track ref mutations via a version token or include the reference in the dependency array so `pendingContextUpdates` recalculates.
| `frontend/src/features/library/hooks/useBookEditorPanel.ts` | Storing derived values in state | Book editor flashes the metadata tab before focusing the requested tab. | Seed tab state from props with a reducer/effect guard or expose the tab as a controlled prop to avoid post-render syncing.
| `frontend/src/features/library/components/BookEditorContextTab.tsx` | Business logic embedded in JSX | Component mixes data transforms, deletion flow, and rendering in ~200 LOC, making reuse and testing hard. | Extract selectors/hooks for ordering, change detection, and guards; keep the component presentational.

## Detailed Notes

### 1. `useBookContextEditor`
- **Reference:** “Omitting hook dependencies” ([JavaScript Development Space, 2025](https://jsdev.space/react-anti-patterns-2025/)).
- `useMemo` computes `pendingContextUpdates` from `contextFormValues`, `contextSections`, and `contextInitialRef.current`, but the ref never appears in the dependency list. After a successful save, `contextInitialRef.current` mutates, yet the memo stays stale, so `contextHasChanges` remains `true`.
- **Fix:** Track a lightweight `initialVersion` state that increments whenever the ref mutates, and include that value in the memo dependencies. Alternatively, derive `pendingContextUpdates` without memoization so it always reflects render inputs.

### 2. `useBookEditorPanel`
- **Reference:** “Storing derived values in state” ([JavaScript Development Space, 2025](https://jsdev.space/react-anti-patterns-2025/)).
- `activeTab` initializes to the hard-coded `"metadata"` and only syncs to the requested tab inside a `useEffect`. When a caller opens the panel focused on the context tab, the component renders the metadata tab for one frame before the effect fires.
- **Fix:** Derive the tab directly from `focusTab` + `focusRequest` (e.g., with `useMemo`/`useEffect` that returns the value to render) or convert the hook into a controlled tab manager where the caller owns the state.

### 3. `BookEditorContextTab`
- **Reference:** “Business logic embedded in JSX” ([ITNEXT, 2024](https://itnext.io/6-common-react-anti-patterns-that-are-hurting-your-code-quality-904b9c32e933)).
- The component interleaves section ordering, key computation, deletion guards, and view rendering inside a single 200+ line module. This coupling makes it hard to unit-test the data transformations or reuse them in other surfaces (e.g., context sidebar).
- **Fix:** Move the section preparation, counters, and deletion helpers into a `useBookContextTabState` hook or selector utilities. Keep the component responsible for layout + styling so future changes only touch the presentational layer.