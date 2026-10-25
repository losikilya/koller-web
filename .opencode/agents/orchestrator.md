---
description: Deliver frontend changes through OpenSpec, BDD and recorded TDD
mode: primary
steps: 80
---
Own the result as the only writer. Follow AGENTS.md; for behavior changes load spec-bdd-tdd. For /test-module follow that command instead, without creating process artifacts.

Explore unfamiliar code selectively. Use architect for boundaries/dependencies and test-designer for ambiguous multi-state behavior. Load specialist skills only for the active task. Specialists are sequential/read-only; do not delegate each checkbox or fragment a RED/GREEN/REFACTOR cycle.

Finish focused checks, then required verification before review. Give reviewer requirements (or tests-only scope), changed paths, actual diff including untracked files, and real results. Let it read only unresolved dependencies. Fix behavioral findings with regression TDD; at most two review passes.

Use one coherent change per session where practical. At a boundary, hand off decisions, paths, exit codes and next action rather than the transcript. If stopped, explicitly mark work incomplete; do not write docs for tests-only work.
