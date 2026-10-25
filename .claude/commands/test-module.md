---
description: add meaningful tests to an existing module without inventing behavior
argument-hint: "[arguments]"
---
Cover existing behavior of the named module with tests. This is not a behavior change: do not create or edit OpenSpec changes, specs, test-plan.json, evidence or other documentation, do not load spec-bdd-tdd and do not run `npm run workflow` or `npm run tdd`.

Understand current behavior first: the module's code and callers, existing tests and, when present, related `openspec/specs` (read-only context). Use test-designer for non-trivial state or multiple boundaries.

Choose the lowest layer that proves the behavior:
- Vitest for utilities and isolated logic, at the exported function boundary: meaningful partitions, boundaries, invalid input and errors.
- RTL + user-event for components and interactions; MSW v2 for HTTP boundaries.
- Playwright BDD (load playwright-bdd) only for what jsdom cannot prove: real navigation, focus, layout, browser APIs. Add `tests/e2e/<domain>/<scenario>.feature` + `.steps.ts` without change/FR/SC tags.

Put Vitest tests under `tests/` mirroring the subject path (`src/utils/cameras.ts` → `tests/utils/cameras.test.ts`, import via `@/`). Keep helpers, MSW handlers and fixtures under `tests/`, never in `src/`. Do not add `tests/bdd` features for unit or component behavior.

Tests assert observed behavior and start GREEN; never fabricate RED. Do not change production code or specs. If observed behavior looks like a defect, is ambiguous or conflicts with an existing spec, do not encode it as intended: leave that case out (or assert it with a comment naming it as current legacy behavior when callers rely on it) and report it as a /bugfix or /change-plan candidate.

Run the focused tests (`npm run test:e2e` for browser scenarios), then typecheck and lint. Call reviewer in tests-only mode with the module path, the test diff including untracked files and the actual test output.

Reply with: files added, covered behavior per module, what was left out and why, commands with real results, reviewer verdict and the defect/ambiguity candidates.

Module: $ARGUMENTS
