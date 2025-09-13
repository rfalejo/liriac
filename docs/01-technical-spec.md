# liriac — Technical Specification (v0.2)

## Product Overview

**Goal:** A distraction‑free Python TUI for writing long‑form books. Each book lives in its own folder with JSON metadata and Markdown chapters (no front matter). The main view is the current chapter. Users type and move the cursor with basic keys. Autosave writes changes on a timer. Characters and world‑building are reference screens only.

**Primary user:** Authors who prefer terminal workflows.

**Non‑goals:** WYSIWYG layout, cloud sync, real‑time collaboration, search, theming, spellcheck, i18n, accessibility, performance targets, telemetry.

---

## High‑Level Architecture

* **Language:** Python ≥ 3.11
* **TUI framework:** `prompt_toolkit` full‑screen app and key bindings.
* **Filesystem I/O:** `pathlib`, `json`, `io`.
* **Storage model:** Human‑readable files on disk. No database.
* **Distribution:** Run from source (clone repo). No Python packages published.

### Modules

* `liriac.app`: Entrypoint and screen router.
* `liriac.ui.editor`: Full‑screen chapter editor.
* `liriac.ui.characters`: Characters reference screen.
* `liriac.ui.world`: World‑building reference screen.
* `liriac.core.models`: Dataclasses for Book, Chapter, Character, WorldElement.
* `liriac.core.repo`: Filesystem persistence and autosave.
* `liriac.core.state`: In‑memory state (current chapter, cursor, dirty flag).
* `liriac.cli`: Minimal commands for init and open.

---

## UX / Screen Map

### Global navigation

* **Default launch:** Open Chapter Editor for `state.json.last_opened_chapter` under the current directory.
* **Global keys:**

  * `Ctrl+S` Save
  * `Ctrl+Q` Quit (confirm if unsaved changes)
  * `Alt+A` Toggle autosave
  * `Ctrl+K` Characters
  * `Ctrl+W` World‑building

### Screens

1. **Chapter Editor**

   * Single full‑screen buffer. No search, replace, go‑to, or undo.
   * Cursor movement via arrows, Home/End, PageUp/PageDown. Typing inserts text. Backspace/Delete remove.
   * Minimal footer with hotkeys and a **lower‑left message area** for errors and status.

2. **Characters**

   * Simple list. Select to view/edit details.

3. **World‑building**

   * Simple list of elements. Select to view/edit details.

---

## File System Layout

```
<BOOK_ROOT>/                 # current working directory
  book.json                  # metadata
  characters.json            # characters DB
  world.json                 # world‑building DB
  chapters/
    01-el-encuentro.md      # user-provided slug
    02-rumbo-al-norte.md
    ...
  .liriac/
    state.json               # last chapter, cursor pos, autosave config
    lock                     # single app-level lock file
```

### Naming rules

* **Chapter slug** is provided by the user on creation. Pattern: `<NN>-<kebab>`, where `NN` is zero‑padded integer (min 2 digits) and `<kebab>` is `[a-z0-9-]+`. Example: `01-el-encuentro`.
* The file name is `<slug>.md`. No automatic renumbering or slug mutation.

---

## Data Models

### 5.1 `book.json`

```json
{
  "title": "My Book",
  "author": "",
  "created_at": "2025-09-12T03:21:00Z",
  "updated_at": "2025-09-12T03:21:00Z",
  "description": "",
  "tags": []
}
```

### 5.2 `characters.json`

```json
{
  "characters": [
    { "id": 1, "name": "Ariadna", "notes": "" }
  ],
  "next_id": 2
}
```

### 5.3 `world.json`

```json
{
  "elements": [
    { "id": 1, "kind": "location", "name": "Liria", "notes": "" }
  ],
  "next_id": 2
}
```

### 5.4 `state.json`

```json
{
  "last_opened_chapter": "01-el-encuentro.md",
  "cursor": { "line": 0, "column": 0 },
  "autosave": { "enabled": true, "interval_seconds": 10 }
}
```

---

## Editor Specification

### Layout

* Title bar: book title · chapter filename · modified flag.
* Text area: free typing with soft wrap.
* Status bar: line/column and autosave status.
* Lower‑left message area: last error or transient status.

### Key bindings

| Action          | Key    |
| --------------- | ------ |
| Save            | Ctrl+S |
| Quit            | Ctrl+Q |
| Toggle autosave | Alt+A  |
| Characters      | Ctrl+K |
| World‑building  | Ctrl+W |

### Editing behavior

* Insert and delete characters. No search, replace, go‑to, or undo.
* **Cursor semantics:** Home/End go to start/end of the **logical line**. Soft wrap is visual only. PageUp/PageDown move by viewport height.
* **EOF & whitespace:** Always write a single trailing `\n` at EOF. Do **not** trim trailing spaces. Normalize line endings to `\n` on save.
* **Tab key:** No action.

---

## Autosave Policy

* **Enabled by default.**
* **Interval:** every 10 seconds if buffer is dirty.
* **Write strategy:** write to `<file>.tmp` then atomic rename to the chapter file.
* **History:** none. No autosave snapshots.
* **Crash recovery:** none.

---

## Core Workflows

### Init Book (current dir)

* `liriac init` scaffolds `book.json`, empty `characters.json`, `world.json`, `chapters/`, and `.liriac/state.json`.

### Open Book

* Run from the book root. App opens the last chapter from `.liriac/state.json`. Fallback to the lexicographically smallest `chapters/*.md`.

### New Chapter

* Prompt for **slug** (must match `<NN>-<kebab>`). Create empty `chapters/<slug>.md`.

---

## CLI

* Run from source after cloning the repo.

  * `python -m liriac` → open current directory as a book.
  * `python -m liriac init` → scaffold minimal structure.
  * `python -m liriac open <path>` → open a book at the given path.

---

## Persistence, Concurrency, and Locks

* **Single app‑level lock** at `.liriac/lock` using atomic create (O\_EXCL). If exists, refuse to start in write mode.
* No detection of external edits.

---

## Language and Encoding

* Language: English only.
* Encoding: UTF‑8. Normalize line endings to `\n`. Filenames sanitized to ASCII with slugify.

---

## Testing Strategy

* Unit: models, repo, autosave timer + atomic writes, slug validator.
* Integration: init → new chapter → type → autosave → manual save → reopen.

---

## Roadmap

**MVP (v0.2):** Chapter Editor with autosave, Characters and World references, run from source.

**Later:** Rename/reorder chapters, word count, optional navigator, export to ZIP.