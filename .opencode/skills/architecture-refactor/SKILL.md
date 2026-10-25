---
name: architecture-refactor
description: Plan, execute and verify wide behavior-preserving frontend architecture refactors with OpenSpec, ADR decisions, recorded GREEN baselines, incremental migration steps and reviewer approval; use for FSD adoption inside sub-apps, sub-app extraction, module-boundary changes, dependency-direction cleanup, state or routing ownership moves, and other structural migrations that must not change observable behavior
---

# Architecture refactor workflow

Use this process only when observable behavior must remain unchanged. For a feature, bug fix or behavior-changing refactor, stop and use `spec-bdd-tdd` instead.

## Plan

1. Explore callers, imports, tests, ADRs and active rules. Ask `architect` to map current and target boundaries, risks, transition seams and rollback.
2. Create the change with:

   ```sh
   pnpm spec new change <change> --schema frontend-architecture-refactor
   ```

3. Follow `openspec instructions` for `proposal`, `design`, `baseline`, `verification-plan` and `tasks`. Do not add delta specs or Gherkin for unchanged behavior.
4. Prefer an incremental vertical slice. State scope, non-goals, stable behavior, affected public APIs, dependency direction, ADR impact and legacy coexistence.
5. Put exact sequential commands in `verification-plan.json`. Choose focused tests plus the smallest relevant typecheck, lint, build or browser checks.
6. Run:

   ```sh
   pnpm spec schema validate frontend-architecture-refactor
   node scripts/architecture-refactor-workflow.mjs check <change>
   ```

7. Stop before code changes. Continue only after the user explicitly invokes `apply` for the named change.

## Establish the baseline

If coverage is insufficient, add characterization tests first without changing production behavior. This is test preparation, not TDD RED. If a test exposes a defect or ambiguous contract, stop and create a separate bugfix or decision.

Before structural edits run:

```sh
node scripts/architecture-refactor-workflow.mjs baseline <change>
```

Every configured command must pass. Do not weaken, skip or replace a failing check merely to obtain a baseline.

## Apply incrementally

- Execute one coherent task at a time and keep one writer.
- Preserve public behavior, side-effect order, error semantics, accessibility and supported URLs.
- Run a focused check after each structural step.
- Do not combine dependency upgrades, dead-code campaigns, design-system migration or product changes unless they are explicitly in scope.
- Mark a task complete only after its relevant check passes.
- If behavior needs to change, leave this change structural and open a linked `frontend-bdd-tdd` change.

## Verify and review

Record the same verification plan against the final code:

```sh
node scripts/architecture-refactor-workflow.mjs final <change>
```

Give reviewer the proposal, design, baseline contract, tasks, complete diff and both evidence reports. Save the actual result in `openspec/changes/<change>/review.md` with exactly `Verdict: PASS` or `Verdict: BLOCKED`.

After all tasks are complete:

```sh
node scripts/architecture-refactor-workflow.mjs ready <change>
```

The ready gate requires matching baseline/final command plans, successful runs, completed tasks, reviewer PASS and an unchanged implementation workspace since final evidence. Archive through the native OpenSpec workflow only after ready.
