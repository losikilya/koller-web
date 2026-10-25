# Design

## ADR impact

NONE. ADR-0002 and Phase 0 decisions remain authoritative. No ownership, package API, source, route or visual changes.

## Scope and tooling

Correct active references and framework-specific assumptions at canonical .opencode sources, then regenerate adapters. Keep architecture centralized in docs/agent-reference/project.md and link from skills. Translate current engineering documentation to English; retain historical reports untouched or explicitly label starter history.

The existing PROCESS requires a verified non-behavior category. Reuse the existing architecture-refactor-workflow baseline/final ledger, independent review and workspace-hash enforcement with a separate frontend-maintenance schema. A strict allowlist rejects app/package source, product tests/specs, Phase 0 and unrelated archived history. Git HEAD and untracked paths must be readable; there is no fallback that blesses an unknown scope. Ordinary BDD/TDD gate logic remains unchanged. Maintenance needs skip_specs true and cannot carry product deltas/test-plan.

Workflow support is bootstrap tooling for this cleanup: new guard tests first failed on real unsupported-schema and permissive-path assertions (ci-reports/cleanup-tooling-red.log), then passed. No absent behavior is invented in the product. Original full application baseline passed before tooling edits. The recorded baseline/final command plan then covers the cleanup on the bootstrapped runner.

## Deletion and rollback

Remove husky/lint-staged/config after checking all actual consumers; retain direct ESLint peer utils, MSW methodology tooling and Vite test tooling. Delete only unused CSS-token tsconfig. Reinstall from existing pnpm store without version upgrades. Git diff/lock resolution comparison and independent review validate removals. Roll back only this change's paths using the recorded clean Git starting point, preserving any later user work.
