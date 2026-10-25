# Phase 1 report

Status: Phase 1 complete. Independent review PASS in two passes; workflow ready and workflow CI pass. Native OpenSpec archive succeeded as `openspec/changes/archive/2026-10-26-dance-platform-foundation`; stable `platform-shell` spec passes strict validation. No Phase 2/3 functionality, commit or deployment.

## Starter audit

The supplied workspace contained agent rules/commands/skills, workflow scripts, Vite/TS/ESLint/Prettier/Vitest/Playwright configuration and an npm manifest/lock. It had no src, tests, OpenSpec schema, node_modules, CI, hooks directory or .git. No existing running application was replaced. No commit, push, deployment or mobile edit was made.

## Phase 0 sources

Read architecture, all fourteen accepted ADRs, design extraction, roadmap, risks/open decisions and acceptance report from C:/Users/Lenovo/dance-battle-app/docs/web-platform. Copied all fifteen Markdown documents into phase-0 unchanged; remaining domain documents are preserved reference material, not a claim of implemented future behavior.

## Delivered foundation

apps/web: Next App Router, server-rendered shell, localized metadata, five route skeletons in en/ru. packages/ui: Container/Button. packages/design-tokens: semantic CSS. packages/contracts: PlaygroundAppId. Root tests/e2e, CI and native OpenSpec change/schema. See workspace-architecture.md for tree/graph and dependency-decisions.md for installed versions.

Home introduces the platform; Playground exposes one tool card; Practice Timer explicitly remains a placeholder; Login/Register explain future authentication with no fake form/session. / redirects to /en; switching locale preserves the supported route; unknown locales/routes return 404. No Phase 2/3 functionality.

## Deviations

ADR-0002 supersedes the banking FSD profile because Phase 0 accepts a Dance Platform modular monolith and no banking source exists. shared-kernel/config deferred until useful. System fonts avoid unverified rights/glyphs. Provisional web token values and 768px menu breakpoint are isolated/documented. Root Vitest preserves TDD workflow; package scripts run targeted tests. Existing agent runtime metadata lock under .opencode is retained separately from the single workspace pnpm lock.

## Validation

Final `pnpm verify` completed with exit code 0 after the CI path syntax fix and its regression guard. Full log: ci-reports/phase1-verify.log. All commands below exited 0.

| Check                                                            | Result                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| pnpm install --frozen-lockfile --offline --store-dir .pnpm-store | Lockfile unchanged; installation succeeds                                                         |
| agents:sync / agents:check                                       | Claude 45 / Codex 58 generated files; zero stale/out-of-sync                                      |
| test:workflow                                                    | 20 tests passed, including workflow entrypoint syntax guard                                       |
| lint / boundaries                                                | Zero errors, zero cycle warnings; resolved graph and negative fixtures pass                       |
| typecheck / format                                               | Strict TypeScript and Prettier pass                                                               |
| test / test:ci                                                   | 21 assertions passed in six files, including executable control BDD; coverage and JUnit generated |
| build                                                            | Production build passes; ten localized routes prerendered                                         |
| test:e2e                                                         | 14 Edge tests pass, including two Playwright BDD journeys                                         |
| spec:validate                                                    | Strict validation passes                                                                          |
| Phase 0 copy comparison                                          | All 15 Markdown copies are byte-identical                                                         |
| React dependency inspection                                      | One version, react/react-dom 19.3.0 across consumers                                              |
| Independent review                                               | PASS, read-only reviewer; actual report stored with OpenSpec change                               |

Coverage is 14.67% statements, 21.27% branches, 20% functions and 15.05% lines. This includes server route/page composition covered by real browser tests rather than artificial unit tests; no coverage threshold existed or was reduced. Four real RED/GREEN/REFACTOR cycles are retained. Their test hashes describe the exact pre-Prettier bytes used during those cycles; subsequent formatting preserved assertions. The existing gate checks immutable evidence hashes and phase ordering, not semantic equivalence of formatted tests. Final tests reran on current files.

Desktop homepage and Russian Playground at 320px were captured by Playwright and visually inspected: readable layout, no overlap/overflow. Browser checks cover all routes, localized metadata, skip focus, language continuity, compact keyboard navigation, 320px/tablet reflow, 404/root handling and console/page errors. No hydration/runtime errors were observed. Hosted GitHub Actions and manual screen-reader/device testing were not executed locally; the CI-equivalent root gate was.

## Remaining work

No blocking implementation issues remain. Full design system, licensed fonts/final brand and manual screen-reader/physical-device validation remain future work. Existing CRA lint dependencies emit upstream deprecation notices; vitest-cucumber's unused generator bin is misnamed upstream, while imported scenarios run successfully. The supplied folder has no .git, so a historical Git diff/clean-baseline certification cannot be produced. Later product phases own Supabase/auth, profiles/privacy, timer engine and persistence. No deployment infrastructure was introduced.

## Changed files

New apps/web, packages/ui/design-tokens/contracts, tests, openspec, .github/workflows/verify.yml, docs/web-platform/phase-0 and phase-1, ADR-0002, pnpm-workspace.yaml, pnpm-lock.yaml, turbo.json, .npmrc. Updated package.json, tsconfig.json, vitest.config.ts, playwright.bdd.config.ts, .eslintrc.cjs, .gitignore, .prettierignore, README.md, AGENTS.md, .opencode/rules/architecture-fsd.md, docs/agent-reference/project.md, scripts/{tdd,workflow-ci,starter-config.test,sync-claude}.mjs and five generated Claude rule adapters. Removed unconsumed index.html, vite.config.ts and root package-lock.json. No unrelated agent commands or skills replaced. See [source-inventory.md](source-inventory.md) for every application/package source path.

## Preserved workflows

OpenCode remains canonical; Claude/Codex adapters are generated with existing scripts. test-module/reviewer/debugging/architecture commands and skills remain in place. Existing workflow/tdd/spec/verify/start/test:e2e entrypoints are retained. Architecture specialist read-only; main session sole writer. No schema or archived history was overwritten; starter supplied no schema/history.

## Local start

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
```

Open http://localhost:3000. Production: pnpm.cmd build, then pnpm.cmd preview (127.0.0.1:4310). Browser tests in PowerShell: `$env:PLAYWRIGHT_BROWSER_CHANNEL='msedge'`, then `pnpm.cmd e2e`. On Unix use pnpm.
