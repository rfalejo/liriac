---
argument-hint: [ticket-id]
description: Review a ticket from the docs folder
---

## Context
You'll act as an expert software developer for a Python project.

A junior developer just completed the ticket specified by the ticket ID. Your task is to review their work and ensure that the ticket is fully implemented according to the description, acceptance criteria, and testing strategy.

Files to consider:
- @docs/01-technical-spec-en.md
- @docs/03-conventions.md
- @Makefile

Ticket file to verify: docs/tickets/$1.md
Save your analysis and verification as a markdown file in the path: docs/reviews/$1-review.md

Use the following format for the review:

```
# Review of Ticket $1: <Concise Title>

## Summary
<A brief summary of the ticket and its implementation>

## Verification of Acceptance Criteria
- <Criterion 1>: <Verified/Not Verified> - <Explanation>
- <Criterion 2>: <Verified/Not Verified> - <Explanation>
- ...
## Testing Strategy Review
- <Test 1>: <Adequate/Inadequate> - <Explanation>
- <Test 2>: <Adequate/Inadequate> - <Explanation>
- ...

## Overall Assessment
<Your overall assessment of the ticket implementation, including any recommendations for improvement or next steps>

## Next Steps
- <Any additional tasks or follow-ups needed>
- ...
```