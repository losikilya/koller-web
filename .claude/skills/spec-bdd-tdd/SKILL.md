---
name: spec-bdd-tdd
description: Plan and implement frontend behavior with OpenSpec, executable Gherkin and recorded RED-GREEN-REFACTOR cycles; use for features, bug fixes and any behavior-changing refactor
---

Read docs/PROCESS.md and the active OpenSpec artifacts.

1. Use the installed OpenSpec CLI to obtain status and artifact instructions; create proposal, delta specs, design, bdd mapping, test-plan.json and tasks in dependency order.
2. Put Gherkin in `tests/bdd/<domain>` or `tests/e2e/<domain>` following the AGENTS.md test layout. Every Scenario has @<change>, @FR-001 and @SC-001 style tags. Keep IDs unique within the change. Map each scenario to a focused Vitest driver in test-plan.json; browser scenarios additionally run through playwright-bdd.
3. If test-plan.json has baseline scenarios, write those tests and record `baseline` first (see "Test passes at RED"). Then write loadable test scaffolds. Run the planning gate. For each scenario run `pnpm tdd <change> <SC-id> red`. Inspect the failure: it must express the absent behavior. Do not accept broken imports or harness setup as RED. If the test passes at RED, follow "Test passes at RED" below.
4. Implement only that behavior. Run the same scenario with green, then refactor. Do not change assertions to fit the implementation. If a test itself is wrong, document why and restart that cycle.
5. Run verify sequentially, request reviewer, save the actual review in review.md, mark completed tasks, and run the ready gate. Review again if code changes.
6. Archive with the native OpenSpec workflow after verification, then validate stable specs. Do not move archived changes into custom year/month folders.

Choose the lowest useful test layer. Isolated deterministic utilities and domain transformations are tested directly with Vitest at their public function boundary; do not render React to prove a pure function. Use table-driven cases only when they make meaningful partitions and boundaries clearer.

## Test passes at RED

`pnpm tdd <change> <SC> red` refuses a passing run. Decide which case it is:

- The behavior is new or changed, so the assertion is too weak or targets the wrong seam. Fix the test and rerun red. Never implement first.
- The scenario describes existing behavior this change must keep, for example a regression guard next to a bugfix in uncovered legacy code. Set `"cycle": "baseline"` and a concrete `baselineReason` for that scenario in test-plan.json, mention it in bdd.md, then run `pnpm tdd <change> <SC> baseline` while production code under `apps/` and `packages/` has no uncommitted edits (before stubs and before the first GREEN of the change; the command refuses otherwise). An optional `refactor` run may follow. Do not alter that behavior in this change. Plan baselines during planning; a baseline test file must not import stubs that do not exist yet.
- A regression guard discovered after implementation started can no longer be a baseline. Add it as an ordinary test without `@<change>` tags and without a test-plan entry, and list it for the reviewer. Never invert or weaken an assertion to manufacture RED.

A change needs at least one RED scenario. If every scenario is baseline, nothing changes: drop the change and use /test-module.

## Not this skill

Tests-only coverage of existing code uses /test-module and creates no OpenSpec change. Pure refactors use team-refactor-safely. If characterization exposes a defect or the work changes behavior, stop and create a bugfix change with a real RED.
