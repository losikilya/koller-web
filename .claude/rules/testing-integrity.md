---
paths:
  - "tests/**/*"
  - "openspec/**/*"
  - "src/**/*.{js,jsx,ts,tsx}"
  - "apps/*/src/**/*.{js,jsx,ts,tsx}"
  - "packages/*/src/**/*.{js,jsx,ts,tsx}"
  - "scripts/*workflow*.mjs"
  - "scripts/tdd.mjs"
  - "vitest.config.*"
  - "playwright*.config.*"
---
# Testing integrity

- Use the lowest sufficient layer: pure logic → direct Vitest; components → RTL + userEvent; HTTP → MSW v2; real browser behavior → Playwright BDD. Cover meaningful partitions, boundaries and errors through public behavior, not implementation mocks or coverage-only assertions.
- Unit/RTL tests live in tests/, mirroring src and importing via @/, never beside production code. Helpers/fixtures stay in tests. Gherkin and adjacent steps live in tests/bdd/<domain> or tests/e2e/<domain> at most two domain levels deep; names do not repeat the folder. Plain browser specs use .spec.ts.
- Behavior changes map OpenSpec requirements → executable scenarios → test-plan.json. Follow spec-bdd-tdd for the recorded cycle. RED must fail for missing behavior, never setup/import/browser failure. Do not fit expectations to implementation; changed requirements need an updated contract and a new cycle.
- /test-module starts GREEN: no production/spec edits, OpenSpec artifacts, test-plan, evidence or process docs. Never fabricate RED. Report suspected bugs/spec conflicts for /bugfix; do not silently fix or bless them.
- A mixed behavior change may declare existing scenarios as cycle: baseline with a reason; preserve clean-production and ordering checks. New/changed behavior still needs RED.
- Use semantic locators, isolated state and condition-based waiting. No arbitrary sleeps, .only/.skip/.todo, inflated retries/timeouts or passWithNoTests to obtain GREEN.
- Report actual commands, exit codes and limitations. Coverage, generated reports and model verdicts alone do not prove correctness.
