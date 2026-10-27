---
name: tech-debt-audit
description: Identify, evidence, classify and prioritize frontend technical debt without automatically refactoring it; use for module health reviews, maintenance planning, migration backlogs and recurring delivery friction
---

# Technical debt audit

An audit is read-only unless the user explicitly requests a report file. Do not convert preferences or unfamiliar code into debt. Every item needs observable cost or risk.

## Scope and evidence

Define the module, time horizon and business context. Inspect code, history available in the repository, tests, dependencies, ADRs, OpenSpec changes and repeated change patterns.

Classify confirmed items:

- code: duplication, opaque control flow, invalid states, dead flexibility;
- architecture: violated boundaries, shotgun changes, missing ownership or unstable public APIs;
- test: absent critical coverage, flaky/inaccurate tests, inaccessible test seams;
- dependency: unsupported, vulnerable, duplicate or migration-blocking packages;
- documentation/process: stale contracts, missing ADR/runbook, manual error-prone workflow;
- performance/accessibility/security: measured recurring quality risk.

## Debt card

For each item record:

```text
ID and title
Category and affected paths
Evidence
Current impact and frequency
Risk if deferred
Interest: recurring cost paid by the team/users
Smallest credible remediation
Effort range and dependencies
Owner or owning area
Trigger/deadline for action
Related ADR/OpenSpec
Confidence
```

Do not use one arithmetic score as truth. Prioritize by user/business risk, security/support horizon, recurring delivery cost, unblock value, remediation effort and confidence. Separate quick containment from structural remediation.

Output: executive summary, evidence-backed debt register, top 3 recommendations, items needing measurement, and suspected items rejected for insufficient evidence. A debt audit does not authorize code changes; selected remediation starts a separate `/refactor`, `/bugfix` or `/feature` workflow.
