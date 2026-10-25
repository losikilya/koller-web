---
name: commit-change
description: Prepare a reviewed Git commit with the team's Jira and OpenSpec message format; use only when the user explicitly asks to create a commit for the current completed change
---

# Commit the current change

Committing never implies pushing.

## Preconditions

1. Inspect `git status`, staged/unstaged diff and untracked files.
2. Confirm the intended scope and exclude secrets, local environment files, generated reports and unrelated changes.
3. Require actual relevant verification. For behavior changes require current OpenSpec review PASS and ready gate. For tests-only/refactor work require the checks defined by that workflow and reviewer PASS.
4. If files changed after verification/review, rerun the affected checks before committing.

## Required inputs

- Jira ticket: ask the user when it was not supplied. Do not invent or infer a ticket number.
- OpenSpec change name: use the explicitly named change that owns the diff, whether it is ready or has just been archived. If exactly one change unambiguously owns the diff, propose it and ask for confirmation; otherwise ask. A tests-only diff from /test-module (only test files and `tests/**`, no production or spec edits) has no change: write `none (tests-only)` and do not create a change to fill this field.
- Summary: derive a short, factual description of all staged changes. Do not claim checks that did not run.

## Message format

Preserve these logical blocks and blank lines:

```text
{JIRA_TICKET}

OpenSpec Change: {change-name}

{short change summary}
```

The Jira ticket is the first line. `OpenSpec Change:` is the second logical block. The summary is concise and covers the complete staged scope.

## Jira identifier safety gate

The company commit check scans the complete message for Jira-shaped identifiers, not only the first line. Before showing or executing the commit, validate the exact final message:

1. Treat `\b[A-Z][A-Z0-9]*-[0-9]+\b` as the Jira-shaped identifier pattern.
2. Require exactly one match in the complete commit message.
3. Require that match to equal the user-provided Jira ticket on the first line.
4. Never repeat the Jira ticket in the summary and never include a second Jira-shaped identifier.
5. Do not write architecture decision references such as `ADR-0001` in the message. Use a non-ticket-shaped form such as `ADR 0001`, `architecture decision 0001`, or a descriptive phrase such as `the FSD architecture decision`.
6. Apply the same restriction to file names, OpenSpec names and any other identifiers mentioned in the summary. If an exact required value would introduce another Jira-shaped identifier, stop and ask the user how to proceed instead of committing.

Reject and rewrite any proposed message that fails this gate. Do not rely only on the ticket being the first line: a later token can be selected by the external Jira validator.

Stage only confirmed files, show the final staged summary and commit message, then request tool approval for `git commit`. After success, report the commit hash and remaining working-tree changes. Never amend, push, rebase or tag unless separately requested.
