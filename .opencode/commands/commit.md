---
description: create a reviewed commit using Jira and OpenSpec metadata
agent: orchestrator
---
Load commit-change. Inspect the complete working tree and confirm verification/review is current. Ask for the Jira ticket when absent and confirm the owning OpenSpec change. Stage only the approved scope, show the final message and request permission for git commit. Never push, amend, rebase or tag.

Inputs: $ARGUMENTS
