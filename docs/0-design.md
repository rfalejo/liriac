# liriac
Python CLI/TUI for writing novel/long-form fiction with AI assistance.

## Goals
- Offline-first writing with file-based storage.
- Fast iteration with minimal friction.
- Reproducible, inspectable prompt assembly.
- Simple, safe append-only generation to start.

## Non-Goals (for now)
- Multi-user collaboration or sync.
- Full CMS or layout/print tooling.
- Rich WYSIWYG editor beyond focused TUI/CLI.

## Features
- Write and edit chapters with AI assistance (AI append-only; human edits anywhere).
- Manage book structure (chapters-only).
- OpenAI models only initially; design allows more providers later.
- Minimal TUI for distraction-free writing.
- CLI for quick operations and scripting.
- Highly configurable context system for AI prompts.

## Architecture
- CLI-first (Click); minimal Textual TUI later.
- Provider-abstracted AI client (OpenAI-only in v0.1; pluggable later).
- File-based store under `books/<slug>/`.
- Prompt-as-template with variables and overrides per book.

## How it works
- Organize your book into chapters. The structure is stored in a `books` directory with a markdown file and a JSON context file for each chapter. For example:
  ```
  books/
    my_fantasy_novel/
      metadata.json
      characters.json
      world_info.json
      chapters/
        ch_01.md
        ch_01.json
        ch_02.md
        ch_02.json
        ...
      history/
        ch_01/
          20250101-120000.md
          20250101-121500.md
  ```
- Use AI to append only to the end of chapters; generation never overwrites existing text.
- Edit existing chapters manually anywhere in the text.
- Initially supports only chapters (no sections or parts).
- TUI is built with Textual.
- CLI is built with Click.
- Configurable context system for AI prompts.

# Context System

## Schemas (minimal, extensible JSON)
- `metadata.json`:
  - `title` (str), `slug` (str), `genre` (str), `audience` (str), `tone` (str)
  - `style_prefs` (str or obj), `outline` (str), `themes` (str or [str])
  - `model` (str, optional override), `prompt_template` (str, optional)
- `characters.json`:
  - `characters`: [
    `{ id, name, role, pov, voice, goals, secrets, notes, status }`
  ]
- `world_info.json`:
  - `locations` ([{ id, name, summary }])
  - `factions` ([{ id, name, summary }])
  - `rules` ([{ id, name, summary }])  // e.g., magic/science rules
  - `timeline` ([{ id, when, what }])
  - `tone` (str)
- `chapters/ch_XX.json`:
  - `id` (str), `number` (int), `title` (str), `pov` (str)
  - `synopsis` (str), `beats` ([str]), `goals` ([str]), `conflicts` ([str]), `continuity` ([str])
  - `include`: `{ characters: [id], world_sections: [id or section], prev_chapters: int | "all", custom: [path] }`
  - `summary` (str, cached auto-summarization of the chapter)
  - `last_updated` (ISO 8601)

## Context Assembly
- Defaults: Always include `metadata`; others opt-in via `chapter.include`.
- Budgeting: Target token limit with priority (no automatic trimming; overrun shown for manual adjustment):
  1) chapter synopsis/beats,
  2) selected characters,
  3) selected world sections,
  4) previous chapter summaries,
  5) full previous text until budget.
- Summarization: Cache per-chapter summary in `ch_XX.json.summary`; update when `.md` changes.
- De-duplication: Merge by character/world ids; drop repeated facts by key.
- Preview: “Context preview” enumerates sources, sizes, and overruns with suggested trims.

## AI Integration
- Providers: OpenAI models only in v0.1. Design is provider-agnostic to support additional providers (e.g., local/Ollama, OpenAI-compatible) in later versions.
- Configuration:
  - `OPENAI_API_KEY` (env), `MODEL` (env or `metadata.json`), optional `OPENAI_BASE_URL` for enterprise.
- Streaming: Token streaming to the editor; cancel mid-generation; undo last generation.
- Retries: Exponential backoff; surface 413/429 with guidance to adjust context; deterministic `seed` knob when supported.
- Cost/Token: Optional live token count and cost estimate; dry-run mode (tokenize-only).
- Prompts: Jinja-like templates with variables; per-book template override via `metadata.json.prompt_template`.

## TUI/UX
- Main View: Chapter editor with bottom command bar.
- Panels: Context Config modal, Characters/World side panes, Diff/History modal.
- Shortcuts: `F5 Generate`, `Ctrl+S Save`, `Ctrl+/ Commands`, `Ctrl+P Context`, `Ctrl+H History`, `Ctrl+F Find`.
- Status: Context dots, tokens, autosave, model name, last gen duration.
- Safety: Undo last N generations; autosave every N seconds and on blur.

### Command Palette Style
```
┌─ liriac - My Fantasy Novel ─────────────────────────────────────────────┐
│                                                                          │
│        Chapter 03: The Ancient Forest                                   │
│        ═══════════════════════════                                      │
│                                                                          │
│        The morning mist clung to the forest floor like ghostly          │
│        fingers, weaving between the ancient oaks that had stood         │
│        sentinel for centuries. Elena stepped carefully over the         │
│        fallen logs, her heart racing with both excitement and fear.     │
│                                                                          │
│        As she pushed deeper into the woods, the air grew thick          │
│        with an otherworldly energy. The trees seemed to whisper         │
│        secrets in a language she almost understood.                     │
│                                                                          │
│        |                                                                │
│                                                                          │
│                                                                          │
│                                                                          │
├─ Command Bar ────────────────────────────────────────────────────────────┤
│ Generate[F5] Save[Ctrl+S] Commands[Ctrl+/] │
│ Tokens: 2,847/4,000 | Auto-save: ON │
└──────────────────────────────────────────────────────────────────────────┘
```

## CLI Surface
- Init:
  - `liriac init books/MyBook`
    - Creates `metadata.json`, `characters.json`, `world_info.json`, `chapters/`.
- Chapters:
  - `liriac chapter new 03 "The Ancient Forest"`
  - `liriac chapter open 03`
- Generate:
  - `liriac gen 03 --tokens 400 --dry-run --preview`
- Context:
  - `liriac ctx show 03 --budget 4000`
  - `liriac ctx set --characters A,B --prev 2`
- Summaries:
  - `liriac summarize 01..03 --rewrite-missing`
- Characters/World:
  - `liriac char add "Elena" --pov`
  - `liriac world add location "Old Oak"`

## Storage & Versioning
- Layout:
  - `books/<slug>/` with `metadata.json`, `characters.json`, `world_info.json`
  - `chapters/ch_01.md`, `chapters/ch_01.json` (zero-padded numbers)
- History:
  - `history/ch_01/yyyymmdd-hhmmss.md` snapshots; optional Git integration.
- Naming:
  - Slug from title; keep spaces out of filenames.
- Frontmatter (optional):
  - YAML in `.md` for quick mirrors (id, title), but `*.json` are source of truth.

## Testing & Reliability
- Unit: Context selection and budgeting with fixtures.
- Golden: Prompt assembly snapshots per chapter config.
- TUI: Smoke tests for key shortcuts; non-interactive render checks.
- Providers: Mock OpenAI client for deterministic runs; 413/429 handling tests.

## Roadmap
- v0.1:
  - CLI/TUI skeleton, context builder, OpenAI-only, append-only generation.

## Context Configuration UI Samples

### Checkbox Tree - Option 1: Standard Tree
```
┌─ Context Configuration ──────────────────────────────────────────────────┐
│                                                                          │
│ Select what to include in AI prompts:                                   │
│                                                                          │
│ ☑ Book Metadata (Always included)                                       │
│ │ ├─ Title, genre, target audience                                       │
│ │ ├─ Writing style preferences                                           │
│ │ └─ Plot outline and themes                                             │
│ │                                                                        │
│ ☑ Characters                                           [Manage Characters]│
│ │ ├─ ☑ Elena Rodriguez (Protagonist)                                     │
│ │ ├─ ☐ Marcus Chen (Supporting)                                          │
│ │ ├─ ☑ The Oracle (Antagonist)                                           │
│ │ └─ ☐ Village Elder (Minor)                                             │
│ │                                                                        │
│ ☑ World Information                                      [Edit World Info]│
│ │ ├─ Geography and locations                                             │
│ │ ├─ Magic system rules                                                  │
│ │ └─ Historical timeline                                                 │
│ │                                                                        │
│ ☑ Previous Chapters                                                      │
│ │ ├─ ☑ Chapter 01: Prologue                                              │
│ │ ├─ ☑ Chapter 02: Awakening                                             │
│ │ └─ ☐ Summary only (vs full text)                                       │
│ │                                                                        │
│ ☐ Custom Context Files                                    [Add Custom...]│
│                                                                          │
│ Estimated Context Size: 2,847 tokens                                    │
│                                                                          │
│ [Apply] [Reset to Defaults] [Cancel]                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Open Questions
- Characters/World sharing: remain Book-scoped for now; consider copy-on-write templates or global catalogs later. World sharing remains out of scope for now.
- Trim strategy weights: No automatic trimming; user selects context manually.
- StopPolicy model-specific validation: Yes via adapters; domain validates basic shape only.
- Previous chapters: Full text vs summaries default? How many by default?
- Templates: Ship opinionated default or minimal scaffold?
- Multilingual: Any requirements for non-English texts?
- Sync: Single-user file system only, or plan for Git-friendly flows?
- Privacy: Any PII handling or opt-out telemetry requirements?

## TUI Wireframes (ASCII)

### Main View (Editor + Panels)
```
┌─ liriac - {Book Title} ──────────────────────────────────────────────────┐
│ {Chapter NN}: {Chapter Title}                                           │
│ ═══════════════════════════════════════════════════════════════════════ │
│ [Editor Area: markdown text, soft wrap, cursor line highlight]         │
│                                                                         │
│                                                                         │
│                                                                         │
│                                                                         │
│                                                                         │
│                                                                         │
├─ Status Bar ────────────────────────────────────────────────────────────┤
│ Model:gpt-4o-mini  Tokens: 2,847/4,000  Autosave:ON  Last Gen: 12.4s    │
│ F5 Generate  Ctrl+S Save  Ctrl+/ Commands  Ctrl+P Context  Ctrl+H Hist  │
└─────────────────────────────────────────────────────────────────────────┘

Right Pane (toggle with F2):
┌─ Context ───────────────────┐   ┌─ Characters ─────────────┐   ┌─ World ───────────────┐
│ Budget: 2,847/4,000         │   │ ✎ Elena (POV)            │   │ ✓ Locations (3)       │
│ ✓ Metadata                  │   │   goals… voice…           │   │   - Old Oak           │
│ ✓ Characters (3)           │   │ ☐ Marcus                  │   │ ✓ Rules (2)           │
│ ✓ World (Rules,Timeline)   │   │ ✓ The Oracle              │   │   - Magic Constraints │
│ ✓ Prev: 2 summaries        │   └───────────────────────────┘   │ ✓ Timeline (4)        │
│ ☐ Custom (0)               │                                   └───────────────────────┘
└─────────────────────────────┘
```

### Command Palette (Ctrl+/)
```
┌─ Command Palette ───────────────────────────────────────────────────────┐
│ > gen next 400 tokens                                                   │
│                                                                          │
│ Actions                                                                  │
│ ▸ Generate next (F5)                         Hint: choose tokens…        │
│   Summarize chapters 01..03                 Hint: dashboard              │
│   Open Context Config (Ctrl+P)              Hint: toggle pane            │
│   Chapter: New from template                Hint: number/title           │
│   Search in project                         Hint: grep chapters/*.md     │
│                                                                          │
│ Filters: actions | chapters | characters | world | settings              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Context Config Modal (Ctrl+P)
```
┌─ Context Configuration ─────────────────────────────────────────────────┐
│ Include in prompt (target 4000): 2,847                                  │
│                                                                          │
│ ☑ Book Metadata (always)                                                 │
│ ☑ Characters (3)              [Manage Characters]                        │
│   ▸ Elena (POV)  ▸ The Oracle  ☐ Marcus                                  │
│ ☑ World Info                   [Edit World Info]                         │
│   ☑ Rules (2)  ☐ Locations  ☑ Timeline                                   │
│ ☑ Previous Chapters: 2  (⊙ Summaries • Full text)                        │
│ ☐ Custom Files (0)           [Add…]                                      │
│                                                                          │
│ Overrun strategy: Trim prev summaries first ▾                             │
│                                                                          │
│ [Apply]   [Reset]   [Cancel]                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Generation Settings Popover (F6)
```
┌─ Generation Settings ───────────────────────────────────────────────────┐
│ Model: gpt-4o-mini ▾   Max tokens: [400]   Temperature: [0.7]           │
│ Seed: [auto]   Retries: [2]   Stop at: ["\n\n"]                          │
│ Cost: est 0.3k tokens ($0.0012)                                          │
│ [Save as default]   [Close]                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Characters Editor Pane
```
┌─ Characters ────────────────────────────────────────────────────────────┐
│ [+ New]  [Import]  [Export]                                             │
│ Filter: [pov ▾]  Search: [elena]                                        │
│                                                                          │
│ ▸ Elena Rodriguez (POV, Protagonist)                                     │
│   Voice: thoughtful, curious                                             │
│   Goals: find the oracle; protect village                                │
│   Secrets: —                                                             │
│                                                                          │
│   [Edit] [Duplicate] [Delete]                                            │
│                                                                          │
│   Others: ☐ Marcus  ✓ The Oracle                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

### World Info Editor Pane
```
┌─ World Info ────────────────────────────────────────────────────────────┐
│ Tabs: [Locations] [Factions] [Rules] [Timeline]                         │
│ [+ New]  Search: [oak]                                                  │
│                                                                          │
│ Locations                                                                │
│ ▸ Old Oak — Ancient tree at forest heart                                 │
│   [Edit] [Delete]                                                        │
│                                                                          │
│ Rules                                                                    │
│ ✓ Magic Constraints — Three-spell limit                                  │
│ ✓ Leylines — Energy flows along roots                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### History / Diff Modal (Ctrl+H)
```
┌─ History for ch_03 ─────────────────────────────────────────────────────┐
│ 2025-01-01 12:00:00  [View] [Restore]                                   │
│ 2025-01-01 12:15:00  [View] [Restore]                                   │
│                                                                          │
│ [Compare ▼]  12:00:00  vs  12:15:00  [Swap]  [Open Diff]                 │
└──────────────────────────────────────────────────────────────────────────┘

Diff (side-by-side)
┌───────────────────────────────┬──────────────────────────────────────────┐
│ - The morning mist clung...   │ + The morning mist curled...             │
│ - She stepped carefully...    │ + She stepped lightly...                 │
└───────────────────────────────┴──────────────────────────────────────────┘
```

### Book Selector / Chapter Browser
```
┌─ Books ─────────────────────────────────────────────────────────────────┐
│ Recent                                                                  │
│ ▸ books/my_fantasy_novel                                                │
│   chapters: 12   updated: 2025-01-01                                    │
│                                                                          │
│ [Open…]  [Init New Book…]                                               │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Chapters (my_fantasy_novel) ───────────────────────────────────────────┐
│ [+ New Chapter]  [Rename] [Delete] [Reorder]  Search: [ancient]         │
│ 01 Prologue                                                             │
│ 02 Awakening                                                            │
│ ▸ 03 The Ancient Forest                                                 │
│ 04 The Oracle                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Error / Notifications
```
┌─ Error ─────────────────────────────────────────────────────────────────┐
│ 413: Context length exceeded.                                           │
│ Suggestion: Reduce previous chapters or trim summaries.                 │
│ [Shrink Context] [Open Context Config] [Close]                          │
└──────────────────────────────────────────────────────────────────────────┘

Toast (non-blocking):
[✓ Saved]   [✖ Rate limit; retrying in 2s…]
```

## MVP Now

- CLI-first: init books, manage chapters, generate append-only text.
- Context preview with budget and suggested trims (no auto-trim).
- OpenAI-only provider; direct tokenizer/counting in adapter.
- File-based storage with history snapshots; no domain versioning.
- Minimal types: keep `ChapterId` and `Slug`; use plain fields elsewhere.

## Later

- Full TUI with panels and editors.
- Rich domain VOs and immutability/events.
- Repositories/UoW and multiple backends.
- Optimistic concurrency across processes.
- Provider-agnostic adapters (Ollama, others) and advanced stop policies.
- Cached summaries and automated trim strategies.
