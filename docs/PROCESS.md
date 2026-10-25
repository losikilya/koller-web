# Frontend delivery process

OpenSpec owns requirements and contract evolution; BDD makes acceptance examples executable; TDD records the implementation sequence. Gherkin alone is not TDD evidence, and passing unit tests alone do not connect implementation to requirements. [Project reference](agent-reference/project.md) defines current paths/architecture; [AGENTS.md](../AGENTS.md) defines shared ownership and loaded rules.

The main session is the only writer. Use architect for boundary/dependency decisions, test_designer for ambiguous scenarios and reviewer for independent requirements/engineering inspection. Specialists are sequential/read-only, inherit permissions and never recursively delegate. Codex uses explicit $team-\* skills; [CODEX.md](CODEX.md) maps workflow labels. Model/iteration budgets do not prove completion.

## Behavior changes

```sh
pnpm spec new change add-example --schema frontend-bdd-tdd
pnpm spec status --change add-example --json
pnpm spec instructions proposal --change add-example --json
```

Read each next artifact's CLI instructions before writing it. Order: proposal → specs → design → bdd → test-plan → tasks. Proposal carries FR/NFR/UX IDs, scope and non-goals; specs define complete observable contracts; design records approach/ADR impact. Preserve all existing scenarios in MODIFIED requirements. Resolve blocking questions before implementation. A plan-only command stops after the concrete plan; an explicit implementation request authorizes applying its scope.

Canonical tagged Gherkin lives in tests/bdd/<domain> or tests/e2e/<domain> beside steps and remains executable after archive. Each change-owned scenario has @<change>, @FR-001 and @SC-001 tags; scenario IDs are unique within the change. bdd.md links to canonical features without copying them.

## Test layers and placement

- apps/web/src/path/file.ts → tests/apps/web/path/file.test.ts; import through @/.
- packages/<name>/src/path/file.ts → tests/packages/<name>/path/file.test.ts; use explicit package exports.
- Pure logic uses direct Vitest calls and meaningful partitions/errors; do not render React for a pure function or test trivial delegates merely for coverage.
- RTL covers observable component behavior; MSW v2 covers actual HTTP boundaries. Vitest-cucumber steps live under tests/bdd; RTL cleanup there belongs to scenario hooks because each step is a test.
- Playwright BDD covers actual routing, focus, layout, scrolling and browser integration; plain browser specs use .spec.ts in tests/e2e. Do not add unit tests for static route composition or duplicate every pure edge case in a browser.

test-plan.json version 1 lists implementationFiles and scenarios with id, requirement, feature, layer (unit/browser) and a focused Vitest testFile. Browser scenarios additionally run through real Playwright BDD. Vitest test names contain SC IDs. Create loadable interfaces/stubs first; missing imports/browsers or broken harnesses are not RED.

## Recorded TDD

```sh
pnpm workflow check add-example
pnpm tdd add-example SC-001 red
# Inspect the assertion failure, then implement only that behavior.
pnpm tdd add-example SC-001 green
pnpm tdd add-example SC-001 refactor
```

The wrapper saves real report bytes, test/report hashes, timestamps, exit codes and phase sequence. A successful RED wrapper exits 0 because it verified a failing behavior assertion; the runner's failure exitCode remains in evidence. GREEN requires prior RED; REFACTOR requires GREEN and an unchanged test. Do not replace expected values with actual values. Correct an erroneous test with an explanation and restart the cycle. A small related group may record several REDs before a shared implementation.

If RED already passes, either strengthen an inadequate new-behavior assertion or explicitly classify an existing regression guard as cycle baseline with a concrete baselineReason before implementation. Run pnpm tdd <change> <SC> baseline before any GREEN while production under apps/packages is committed/clean. Preserve that behavior and the same test; optional refactor may follow. A behavior change requires at least one real RED; all-baseline work belongs to tests-only. A regression discovered after implementation begins is an ordinary untagged test, not a retroactive baseline. Reviewer checks this distinction.

One test process at a time. .workflow-running protects the TDD wrapper, not all manual processes. Remove a stale lock only after proving its process stopped. Never weaken assertions, thresholds or gates, accept setup failures as RED, suppress cycles or use skipped tests to obtain GREEN.

## Verify, review and archive

Use focused checks during implementation and the full pnpm verify on completed work; rerun affected checks/full gate after material fixes. Preserve real exit codes separately from truncated logs. verify sequentially checks generated agents, workflow tests, lint/boundaries, strict types, formatting, Vitest/coverage, production build, browser BDD and strict specs. Keep existing coverage conventions; mutation tests may help narrow risky logic but no blanket 95% requirement exists.

Independent reviewer checks both requirements/evidence and engineering/ADR/architecture, including simplicity. Save its actual Verdict: PASS or Verdict: BLOCKED with scope, findings and limitations; distinguish parent-run checks from reviewer inspection. At most two passes. Never convert unexecuted review to PASS. Mark only verified tasks complete, then run pnpm workflow ready <change> for behavior changes.

Native pnpm spec archive <change> updates stable specs and archives the change after fresh verification/ready. Read the CLI plan/confirmation; never edit archived history or move it into custom year/month folders. Run pnpm spec:validate afterward. Git reports establish real state, not checklists or model verdicts. Evidence is editable and hashes detect accidental mismatch, not fraud. CI reruns checks and requires changed workspace source to belong to a verified behavior change. Protect Frontend quality / verify through the team's branch policy.

## Tests-only and refactoring

/test-module starts GREEN on existing behavior: no production/spec/process-doc changes, no OpenSpec/test-plan/evidence, no workflow/tdd commands. Use Vitest, RTL/MSW or Playwright at the lowest sufficient layer; its browser Gherkin carries no change/FR/SC tags. Report defects/conflicts rather than silently fixing them; fixes use /bugfix. Return a concise handoff in chat, not a new documentation file.

/refactor uses team-refactor-safely with characterization, small steps and independent simplicity review. If observable behavior changes, use the behavior workflow. Wide boundary/ownership migrations use architecture-refactor, its own schema and recorded baseline/final evidence; do not call unrelated docs cleanup an architecture migration. The supplied architecture-refactor schema is currently absent; restoring it is a separate, explicit task before that workflow can execute, not a reason to fake behavior evidence.

## Scoped maintenance

Docs/config/dependency cleanup has no product delta and must not fabricate product RED. Use native frontend-maintenance with skip_specs: true. This narrow category reuses the existing baseline/final runner and review policy rather than changing BDD/TDD methodology:

```sh
pnpm spec new change <change> --schema frontend-maintenance
node scripts/architecture-refactor-workflow.mjs check <change>
node scripts/architecture-refactor-workflow.mjs baseline <change>
# Apply only verified cleanup within the checked allowlist.
node scripts/architecture-refactor-workflow.mjs final <change>
node scripts/architecture-refactor-workflow.mjs ready <change>
```

Required artifacts: proposal (Change kind: maintenance; Behavior contract: unchanged), design with ADR impact, baseline with observable contract, verification-plan.json with exact sequential commands and tasks. Same successful plan must run before/after cleanup; reviewer PASS, complete tasks and unchanged workspace hash are mandatory. Scope includes only explicit docs/agent/manifests/config/tooling paths and own process artifacts. App/package source, product tests/specs, Phase 0 and unrelated archived history are rejected. Readable Git HEAD/worktree is required; existing unrelated changes must be isolated rather than blessed. Stop this category if the app contract needs changes. Tooling guard changes require their own meaningful regression tests; no product baseline is called RED. Keep the full existing verify and independent review. Human acceptance is based on the delivered report and real evidence.

## Commits and handoff

No commit/push/publication without an explicit request. /commit requires a user-supplied Jira ticket, owning OpenSpec change and current verification/review. Tests-only uses OpenSpec Change: none (tests-only). Keep the exact Jira message safety checks in commit-change; committing never authorizes pushing. Do not invent ticket IDs.

Use one coherent change per session where practical. Handoff only decisions, paths, actual exit codes and next action. A stopped change remains incomplete; do not rewrite evidence/history to manufacture completion. Avoid global instructions imports and loading all archives/context. Permissions and role instructions are not substitutes for technical sandbox or branch protection.
