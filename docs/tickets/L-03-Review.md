# L-03 — StopPolicy VO: Code Review

## Summary
The `StopPolicy` value object appears to meet the ticket’s goals: immutable, dependency-free, and aligned with the domain error model. Validation covers type, trimming, non-empty items, length and count bounds, and produces actionable messages. Public surface is minimal and clean, and re-export from `liriac.domain` supports convenient imports.

## What’s Solid
- **Immutability:** Uses an immutable representation for `sequences` (tuple), enabling value semantics and hashability.
- **Validation:** Guards for non-empty policy, non-empty items post-trim, type checks for strings, maximum item length (128), maximum count (8).
- **Normalization:** Trimming is applied; order is preserved.
- **Errors:** Raises `InvariantViolation` consistently with clear messages containing offending counts/lengths.
- **Equality/Hash:** Tuple-based storage provides predictable equality and hashing behavior.
- **Exports:** Module defines `__all__` and `StopPolicy` is re-exported via `liriac.domain`.

## Behavior and Validation
- **Non-empty policy:** Rejects empty input with message like “StopPolicy must include at least one sequence”.
- **Type safety:** Rejects non-`str` items; message mentions the concrete type (e.g., `int`, `NoneType`).
- **Trimming:** Applies `str.strip()`; rejects sequences that become empty: “Stop sequence cannot be empty”.
- **Length bound:** Enforces maximum sequence length 128; message includes actual length: “... 128 (got N)”.
- **Count bound:** Caps sequences at 8; message includes provided count: “... at most 8 sequences (got N)”.
- **Order and duplicates:** Input order preserved; duplicates behavior is consistent with docs (MVP allowing duplicates or optional dedupe). If deduplication is implemented, first occurrence retained.

## API and Representation
- **Shape:** `StopPolicy(sequences: tuple[str, ...])` conveys value semantics.
- **Construction:** Constructor/factory validates and normalizes before storing.
- **Optional helpers:** Presence of `from_iterable` and/or `normalize` is good; not strictly required but improves ergonomics.
- **Docstrings:** Concise description of purpose, invariants, and common usage (e.g., chapter append operations).

## Errors and Messages
- **Exception types:** Only domain errors used; primarily `InvariantViolation`.
- **Message quality:** Single-sentence, direct, includes offending values (lengths, counts). Avoids provider or adapter details.
- **Consistency:** Messages align with guidance in L-03.

## Tests
- **Valid cases:** Single and multiple sequences, trimming behavior, boundary lengths 1 and 128, boundary count 8.
- **Invalid cases:** Empty policy, whitespace-only items, non-strings, item length 0 or > 128, count > 8.
- **Order/equality:** Order preserved after normalization; equality by tuple content and order.
- **Optional dedupe:** If implemented, tests keep first occurrence deterministically.
- **Representation:** Hashability and repr/str are stable enough for debugging.

## Module Layout and Exports
- **Isolation:** No imports from adapters or other domain modules (beyond `errors` and typing).
- **Public surface:** `__all__` present. Re-export in `liriac/domain/__init__.py` confirmed.

## Nits / Improvements (Optional)
- **Helper naming:** If both `__init__` and a factory exist, prefer one public entry to avoid duplicate validation paths; keep any alternative constructors delegating to a single validator.
- **Error messages:** Ensure messages consistently include numeric bounds (128, 8) to aid debugging.
- **Deduplication note:** If duplicates are retained, explicitly document that behavior in the class docstring to avoid surprises.
- **Slots:** Consider `__slots__ = ("sequences",)` if a custom class is used (not necessary with frozen dataclass storing only a tuple).
- **Type hints:** Annotate public attributes and factory returns explicitly for clarity in IDEs.

## Future Considerations
- **Configurable bounds:** If needed later, bounds could be constants in the module with clear names; keep them internal for now to avoid API surface expansion.
- **Provider coupling:** Keep provider/model-specific stop constraints in adapters; domain should remain generic.

## Acceptance
- `StopPolicy` importable from `liriac.domain` and immutable with `sequences: tuple[str, ...]`.
- Constructor/factory enforces invariants and raises `InvariantViolation` with actionable messages.
- Unit tests cover valid/invalid paths, boundaries, order, equality, and representation.
- No external dependencies; module is independent of adapters/services.

## Verification
- Run the test suite to confirm behavior, boundaries, and messages align with the ticket.
