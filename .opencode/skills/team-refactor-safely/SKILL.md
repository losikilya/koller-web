---
name: team-refactor-safely
description: Plan and perform behavior-preserving frontend refactoring with characterization tests, small verified steps and a simplicity review; use for explicit refactor requests, reducing complexity, removing dead abstractions or improving module seams
---

# Safe refactoring

Refactoring changes structure without changing externally observable behavior. If requirements change, stop and use the normal OpenSpec behavior workflow.

## 1. Define the boundary

- State the target, motivation, non-goals and observable behavior that must remain stable.
- Read callers, tests, public APIs, ADRs, active architecture boundaries and relevant anchors.
- Establish a green baseline. Add characterization tests at the public seam when coverage is insufficient; never claim this as RED.
- For a wide or architectural refactor, create an OpenSpec design/tasks plan and request architect review.

## 2. Find complexity worth removing

Apply these lenses:

- `delete`: dead code, obsolete compatibility or unused flexibility;
- `native`: custom code that the platform or existing dependency already provides;
- `yagni`: options, factories, strategies or seams with no current variant;
- `shrink`: control flow or concepts that can disappear, not merely move;
- `boundary`: feature logic leaking into shared code or private implementation exposed to callers;
- `naming`: names that hide responsibilities or invariants.

Use the deletion test for abstractions. Preserve a module that centralizes complexity for many callers; remove pass-through layers that add concepts without leverage.

## 3. Refactor incrementally

- Make one coherent structural step at a time.
- Run the smallest relevant tests after each step; periodically run typecheck/lint and finish with required verification.
- Preserve side-effect order, error behavior, accessibility, public types and contracts.
- Do not edit tests merely to accommodate changed behavior. Update tests only when implementation details were asserted unnecessarily, and explain why the observable contract is unchanged.
- Do not mix unrelated cleanup, dependency upgrades or architecture migration.

## 4. Review

Request reviewer with baseline, intended simplification, diff and checks. Reviewer applies correctness plus the simplicity lens, but must not demand fewer lines when the result is harder to understand.
