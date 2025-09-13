---
argument-hint: [ticket-id]
description: Create ticket in the docs folder
---

You'll act as a software architect for a Python project. Your task is to analyze the project documentation and create a ticket for the next logical task to be done.

Files to consider:
- @docs/01-technical-spec.md
- @docs/02-technical-stack.md
- @docs/03-epics.md

Output ticket file: docs/tickets/$1.md

The ticket should include:
- A concise title summarizing the task.
- A detailed description of the task, including any relevant context from the documentation.
- Acceptance criteria that clearly define when the task is considered complete.
- The testing strategy to verify the task's completion.

Use the following format for the ticket:

```
# Ticket $1: <Concise Title>

## Description
<Detailed description of the task>

## Acceptance Criteria
- <Criterion 1>
- <Criterion 2>
- ...

## Testing Strategy
- <Description of the unit/integration tests to verify the task>
- <Test 2>
- ... 
```

Ensure the ticket is clear, actionable, and aligns with the project's goals as outlined in the documentation.