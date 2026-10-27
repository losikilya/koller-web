---
description: create a reviewed commit using OpenSpec metadata
agent: orchestrator
---

Load commit-change. Inspect the complete working tree and confirm verification/review is current. Use the owning OpenSpec change and a factual summary; this project has no Jira-ticket requirement. Stage only the approved scope and show the exact final message. Execute only an explicitly authorized commit; do not ask again when the current operation and scope are already authorized. Every future commit or push needs fresh explicit user authorization. Never push, amend, rebase or tag on the basis of a commit request.

Inputs: $ARGUMENTS
