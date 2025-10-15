# React and Material UI Antipatterns Playbook

This playbook captures notable React and Material UI (MUI) antipatterns reported in 2024-2025 industry articles. Each entry explains the underlying smell, how to detect it in our codebase, and proven remediation strategies.

## How to Use This Guide

- Scan the tables when you review PRs, investigate performance, or plan refactors.
- Leverage the "How to Spot" column alongside profiling, linting, and static analysis.
- Apply the recommended fixes and link back to the cited guidance in commit messages when relevant.

---

## React Antipatterns

| Antipattern | How to Spot It | Typical Fix |
| --- | --- | --- |
| **Storing derived values in state**[^jsdev] | `useState` seeded from props/context plus a syncing `useEffect`; profiler shows double renders; stale UI until effect runs. | Derive the value during render or memoize with `useMemo` using the true inputs. |
| **Recreating handlers and objects every render**[^jsdev] | Inline functions/objects passed into memoized children; React DevTools highlights memo breaks. | Wrap callbacks in `useCallback`, hoist stable objects, or convert components to uncontrolled children. |
| **Omitting or overfilling hook dependency lists**[^jsdev] | ESLint `exhaustive-deps` violations or unnecessary reruns because dependencies change identity each render. | Respect lint warnings, stabilize dependencies first, and ensure effects are idempotent. |
| **Overusing `useEffect` for synchronous logic**[^hamisi] | Effects compute derived data, sync local state to props, or fetch data available during render; hydration regresses on React 19 builds. | Move derivations into render/memo, embrace server components or loaders for data, and restrict effects to true I/O. |
| **Prop drilling across deep trees**[^itnext] | Handlers passed through intermediaries that neither use nor transform them; React DevTools shows long prop chains. | Introduce context, colocate state where it is consumed, or expose domain hooks for shared logic. |
| **Business logic embedded in JSX**[^itnext] | Components >200 LOC containing data transforms, branching rules, and rendering; difficult to unit test. | Extract domain logic into pure utilities, custom hooks, or state machines; keep components presentational. |
| **God components with scattered `useState`**[^jsdev][^itnext] | Dozens of individual `useState` calls modelling a single concept; tangled updates. | Consolidate into `useReducer` or dedicated state objects; split orchestration from presentation. |
| **Forcing remounts with `key` to reset state**[^jsdev] | `key={prop}` used to "fix" state sync, causing UI flicker and lost focus. | Keep components mounted and respond to prop changes via effects or controlled props. |
| **Declaring components inside other components**[^jsdev] | Nested component functions in the body of a parent; every render reallocates them. | Hoist subcomponents to module scope or split files; pass data through props. |
| **Misusing React Server Components (RSC)**[^dhiwise] | Server components attempt to handle interactive state or browser APIs; duplicated data fetching on the client. | Keep interactive UI in client components (`"use client"`), let server components own data access, and share serializable props only. |

### Cross-Cutting Detection Tips

- Enable `eslint-plugin-react-hooks` and treat warnings as blockers to catch dependency drift and conditional hooks.
- Use React Profiler with the flamegraph to spot repeated renders caused by unstable props or derived state in effects.
- Grep for `key={` on dynamic containers when diagnosing state reset bugs.
- Audit server-driven routes: any direct `window`, `localStorage`, or event handlers inside a `.server` file is a red flag.

---

## Material UI Antipatterns

| Antipattern | How to Spot It | Typical Fix |
| --- | --- | --- |
| **Unmemoized props into heavy components**[^devto] | Emotion re-generates classes every render; MUI profiler shows expensive diffing; props change identity frequently. | Memoize handlers/props, wrap components with `React.memo`, and limit inline style objects. |
| **Overusing legacy `makeStyles`/`withStyles`**[^devto][^logrocket] | `@mui/styles` dependency, runtime style injection in dev tools, or warnings when upgrading to v6+. | Migrate to the `sx` prop, `styled()` API, or theme overrides compatible with MUI v5+ and v7 roadmaps. |
| **Inline `sx` everywhere without conventions**[^stackademic][^sencha] | Same component variants defined ad hoc; inconsistent spacing/colors; theming changes require mass edits. | Define reusable variants via theme slots, component overrides, or shared `styled` wrappers; reserve `sx` for one-off tweaks. |
| **Mixing multiple UI libraries**[^sencha] | Bundle contains Chakra, Tailwind, and MUI simultaneously; design tokens diverge; CSS specificity battles. | Standardize on MUI (or Base UI) and migrate conflicting widgets; document allowed third-party components. |
| **Deep, custom overrides on prebuilt widgets**[^sencha] | CSS selectors targeting internal class names (`.MuiButton-root .MuiTouchRipple-root`); updates break layouts. | Use customization APIs (`components` overrides, theme slots, `variants`) before resorting to manual CSS. |
| **Ignoring bundle and load performance**[^devto][^logrocket] | Initial JS payload >2501KB gzipped; Lighthouse reveals render-blocking CSS from unneeded components. | Code-split route-level bundles, lazy-load feature-rich widgets (DataGrid, charts), and tree-shake icons (`@mui/icons-material/SomeIcon`). |
| **Skipping documentation and upgrade guides**[^sencha][^logrocket] | Migration stalls at v4/v5 boundaries; duplicated theme definitions; team unaware of Pigment CSS or Base UI. | Budget time for upgrade plans, follow Material UI release notes, and align codebase with supported styling layers. |

### Detection Playbook

- Run `pnpm analyze` or `pnpm build --stats` to inspect bundle composition and spot unused MUI modules.
- Search for `@mui/styles` or `makeStyles` to flag legacy styling. Automated codemods exist for the initial conversion.
- Lint for `sx={{ ... }}` occurrences inside mapped lists; prefer hoisted style objects or `styled` variants when repetition appears.
- Monitor Storybook (or Chromatic) diffs for design drift when different teams tweak the same component locally.

---

## Remediation Workflow

1. **Triage**: When profiling or reviewing code, map the smell to the table above. Log issues with concrete examples (component name, file path, perf metric).
2. **Plan**: Decide if the fix is local (hoist a callback) or architectural (introduce context, migrate styling). For larger refactors, create ADRs that reference the relevant sources.
3. **Implement**: Apply the recommended fix. Keep commits focused, add tests or stories where behavior changes, and describe the antipattern in the PR summary.
4. **Verify**: Re-run React Profiler, Lighthouse, or bundle analyzers to ensure the change resolves the symptom. Include screenshots or traces in the PR description when possible.
5. **Prevent**: Extend lint rules, storybook checks, and documentation to stop regressions. For example, enforce a custom ESLint rule forbidding `@mui/styles`, or add a lint-staged check for nested component declarations.

---

## References

- [^jsdev]: JavaScript Development Space, "15 React Anti-Patterns (and Fixes) You'll Actually Use," Sept 8, 2025. <https://jsdev.space/react-anti-patterns-2025/>
- [^itnext]: ITNEXT, "6 Common React Anti-Patterns That Are Hurting Your Code Quality," Oct 30, 2024. <https://itnext.io/6-common-react-anti-patterns-that-are-hurting-your-code-quality-904b9c32e933>
- [^hamisi]: Medium (Adnan Hamisi), "Keep Effects Pure, or Pay Later: Why Overusing useEffect in React 19 Is the New Code Smell," Apr 19, 2025. <https://medium.com/@ahamisi777/keep-effects-pure-or-pay-later-why-overusing-useeffect-in-react-19-is-the-new-code-smell-and-cf5d2d529377>
- [^dhiwise]: DhiWise, "React Server Components: Common Mistakes and Fixes," Mar 20, 2025. <https://www.dhiwise.com/blog/design-converter/react-server-components-common-mistakes-and-fixes>
- [^devto]: DEV Community (Syed Mudasser Anayat), "How to Optimize Material-UI Performance in Large-Scale React Applications," Mar 23, 2025. <https://dev.to/syed_mudasseranayat_e251/how-to-optimize-material-ui-performance-in-large-scale-react-applications-1imd>
- [^stackademic]: Stackademic, "Mastering Material UI Customization in React: Best Practices and Choosing the Right Approach," Nov 4, 2024. <https://blog.stackademic.com/mastering-material-ui-customization-in-react-best-practices-and-choosing-the-right-approach-9fdfb81a74c2>
- [^sencha]: Sencha, "Top Mistakes Developers Make When Using React UI Component Library (And How to Avoid Them)," May 26, 2025. <https://www.sencha.com/blog/top-mistakes-developers-make-when-using-react-ui-component-library-and-how-to-avoid-them/>
- [^logrocket]: LogRocket, "MUI Adoption Guide: Overview, Examples, and Alternatives," Jul 30, 2024. <https://blog.logrocket.com/mui-adoption-guide/>
