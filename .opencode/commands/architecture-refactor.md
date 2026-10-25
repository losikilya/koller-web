---
description: plan, apply or verify a behavior-preserving architectural refactor
agent: orchestrator
---
Load `architecture-refactor` and parse `$ARGUMENTS` as one of these modes:

- `plan <change-name> <scope>`
- `apply <change-name>`
- `verify <change-name>`
- `status <change-name>`

Use the `frontend-architecture-refactor` OpenSpec schema. This command is only for structural work whose observable behavior remains unchanged. Do not create Gherkin or fabricate RED evidence.

In `plan` mode, explore the affected graph, request architect analysis, create the OpenSpec artifacts, validate the schema and run the refactor planning gate. Do not modify production code. Stop and ask the user to approve the plan explicitly.

In `apply` mode, treat the invocation as the human approval gate. Confirm the artifacts still pass, establish recorded GREEN baseline evidence before structural edits, execute one checked task at a time, run focused tests after each step, then record final evidence. Request reviewer and save the actual verdict in `review.md`.

In `verify` mode, record fresh final evidence, request reviewer, update `review.md`, and run the ready gate. If code changed after final evidence, record it again before ready.

In `status` mode, inspect artifacts, tasks and evidence without modifying code.

If behavior must change, stop this process and create a separate feature or bugfix change using `frontend-bdd-tdd`.

Request: $ARGUMENTS
