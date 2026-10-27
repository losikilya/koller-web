---
name: commit-change
description: Prepare a reviewed Git commit with OpenSpec metadata; use only when the user explicitly asks to create a commit for the current completed change
---

# Commit the current change

Committing never implies pushing. This project does not use Jira tickets.

## Preconditions

1. Inspect Git status, staged/unstaged diff and untracked files.
2. Confirm the intended scope and exclude secrets, local environment files, disposable generated reports and unrelated changes. Preserve required workflow evidence exactly.
3. Require actual relevant verification. For behavior changes require current OpenSpec review PASS and ready gate. For tests-only/refactor work require the checks defined by that workflow and reviewer PASS.
4. If files changed after verification/review, rerun the affected checks before committing.
5. Every commit and every push requires explicit user authorization for that operation. An authorization already given for the current scope remains valid; do not ask for duplicate confirmation. One authorization never covers future commits or pushes.

## Required inputs

- OpenSpec change name: use the explicitly named change that owns the approved diff, whether ready or just archived. If ownership is unclear, propose the relevant change and clarify scope before staging. A tests-only diff from /test-module (only tests, no production/spec edits) uses `none (tests-only)`; do not create a change to fill this field.
- Summary: derive a short, factual description of all staged changes. Do not claim checks that did not run.

## Message format

Preserve these logical blocks and blank lines:

```text
{short change summary}

OpenSpec Change: {change-name}
```

Add a concise factual body only when it helps explain the complete staged scope. No ticket input, ticket-first line or ticket-pattern restriction applies.

Stage only the approved files. Inspect and show the final staged summary and exact message, then execute the explicitly authorized commit, requesting tool approval only if the runtime requires it. After success report the commit hash and remaining working-tree changes. Never amend, push, rebase or tag unless separately authorized; a commit request alone permits none of those operations.
