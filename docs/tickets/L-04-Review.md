# L-04 — Entities: Book and Chapter — Code Review

## Summary
The Book and Chapter entities meet the ticket’s goals: simple mutable dataclasses with clear, localized invariants; validation delegated to existing value helpers; minimal, predictable public API; and clean re-exports from `liriac.domain`. Mutators preserve invariants, and string representations are concise and useful. The implementation is dependency-free and consistent with the domain error model.

## What’s Solid
- **Validation + Normalization:** `__post_init__` for both entities normalizes fields via helpers (`book_id`, `slug`, `title`, `markdown`, `parse_chapter_id`, `make_chapter_id`) and enforces invariants.
- **Chapter consistency:** Ensures `number > 0`, validates `id` format, checks `id` ↔ `number` consistency, and normalizes to zero-padded form.
- **Mutators:** `Book.retitle`, `Book.reslug` (optional but useful), `Chapter.retitle`, `Chapter.renumber`, `Chapter.replace_text` reuse helpers to keep invariants intact.
- **Errors:** Uses domain errors via helpers; mismatch messages for Chapter id/number include both values and the expected normalized id.
- **Representations:** `__str__` is concise; `__repr__` is constructor-like and stable for debugging.
- **Exports:** `Book` and `Chapter` are re-exported from `liriac.domain`, matching tests and design docs.

## Behavior and Validation
- **Book:**
  - `id`: normalized via `book_id()`; rejects empty/whitespace.
  - `slug`: validated via `slug()`; rejects non-lowercase/hyphens, leading/trailing/consecutive hyphens; practical length bound enforced.
  - `title`: trimmed via `title()`; rejects empty/whitespace; length bound enforced.
- **Chapter:**
  - `number`: must be positive; enforced on construct and in `renumber`.
  - `id`: validated via `parse_chapter_id()`; must match `number`; normalized to zero-padded via `make_chapter_id()`.
  - `title`: trimmed and validated via `title()`.
  - `text`: validated via `markdown()`; accepts empty string, rejects `None`.
- **Mutators:**
  - `Book.retitle` and `Book.reslug` return normalized results or raise domain errors.
  - `Chapter.retitle` trims and validates; `Chapter.renumber` updates both `number` and `id` atomically; `replace_text` validates via `markdown()`.

## API and Representation
- **Shape:** Straightforward dataclasses with fields `id`, `slug`, `title` for Book and `id`, `number`, `title`, `text` for Chapter.
- **String forms:** `__str__` includes key identifiers; `__repr__` shows constructor-like details with normalized state.

## Tests
- Entities behavior matches `tests/domain/test_entities.py`:
  - Construction happy paths, normalization (e.g., Chapter id zero-padding).
  - Invalid cases for title/slug/id/number/text (`None`) raise appropriate domain errors.
  - Mutators maintain invariants.
  - Import surface via `liriac.domain` works as expected.
- Representation assertions pass given current implementations.

## Nits / Improvements (Optional)
- **Module `__all__`:** Consider adding `__all__ = ["Book"]` / `["Chapter"]` in each module to make export intent explicit (not required due to package-level re-exports).
- **Docstring clarity:** Book/Chapter method docstrings could explicitly mention that validation and normalization are delegated to helpers (already implied).
- **Naming shadowing note:** Fields named `title` exist alongside imported `title()` helper; this is fine in practice but worth keeping in mind to avoid confusion in future refactors.
- **`__slots__`:** Could be added to reduce per-instance overhead; not necessary for MVP and can reduce flexibility.
- **Future-proofing ChapterId width:** If chapters exceed 99 later, expanding padding can be handled centrally in `values.py` (not a change request now).

## Acceptance
- Entities satisfy L-04 acceptance criteria: validations, mutators, normalized state, clean re-exports, and tests covering happy/invalid paths and representations.

## Verification
```bash
pytest -q
```
