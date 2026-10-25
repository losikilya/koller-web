# Proposal

Change kind: maintenance
Behavior contract: unchanged

## Scope and evidence

Align active starter guidance and remove proven dead tooling without touching application source, product tests, public contracts, Phase 0 or archived history. The user explicitly authorizes implementation as well as audit.

- KEEP: Vite/plugin-react for Vitest; CRA ESLint baseline; @typescript-eslint/utils as import-x peer; MSW as documented HTTP-test tooling; root React for RTL; .opencode plugin metadata; generic skills and roles.
- UPDATE: README/CODEX/PROCESS/anchor reference, active project reference, framework-specific canonical skills, workspace test examples, pnpm commands and generated adapters. Add a scoped maintenance category to existing baseline/final runner as required by PROCESS; preserve BDD/TDD gates.
- REMOVE: husky/lint-staged and unused lint-staged configuration (no hooks, prepare script or command consumers); packages/design-tokens/tsconfig.json (CSS-only package, no TS/typecheck references).
- DEFER: CRA ESLint migration, optional vitest-cucumber generator packaging warning, missing architecture-refactor schema restoration. None is required for this cleanup and no dependency upgrade is authorized.

## Capabilities

No product capability changes. Native skip_specs is true; maintenance uses GREEN baseline/final, scope enforcement and independent reviewer PASS. Tooling scope guards are tested first with actual Node assertion failures, not fake product RED.
