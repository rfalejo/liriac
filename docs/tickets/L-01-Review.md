# L-01 — Domain Error Hierarchy: Code Review

## Summary
The `liriac/domain/errors.py` implementation cleanly defines a small, cohesive exception hierarchy. It adheres to the ticket’s constraints: minimal dependencies, clear messages, explicit `__all__`, and no cross-module imports.

## What’s Solid
- Clear hierarchy: `DomainError` base with `InvariantViolation`, `ConcurrencyConflict`, `AppendRejected`, `SlugInvalid` (inherits `InvariantViolation`), and `ContextOverBudget`.
- `DomainError` stores `message` and overrides `__str__` to return it; aligns with tests and guidance.
- Docstrings concisely describe intent and usage; messages are free of implementation details.
- `__all__` is present, ensuring clean import surfaces.
- No coupling to other domain modules; avoids cycles.

## Nits / Improvements (Optional)
- Type attribute annotation: consider adding a class-level `message: str` annotation for clarity (not required).
- `__slots__`: could be used to keep instances lean, but not necessary and might reduce flexibility.
- Consider minimal guidance in docstrings on typical raise sites (e.g., where `AppendRejected` is used) to aid discoverability, though tests already cover usage.

## Acceptance
- Meets acceptance criteria and passes the provided tests’ expectations.
- No changes required.

## Verification
```bash
pytest -q
```
