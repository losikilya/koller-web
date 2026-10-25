# Post-Phase 1 cleanup and starter alignment

## Executive summary

Removed confirmed dead hook tooling and the CSS-only tokens TypeScript configuration; aligned active engineering guidance with the existing Next.js monorepo. Application source, product tests, UI/localization/navigation, public contracts, Phase 0, accepted ADRs and previous archived changes are unchanged. No Phase 2 work, dependency upgrade, commit, push or deployment.

Git is now available (unlike the original Phase 1 execution). The starting working tree was clean. Git ownership checks use an execution-local safe.directory setting; no global/repository Git settings were changed. Main session was the only writer; architect/reviewer were sequential and read-only.

## Artifact classification and removals

| Classification | Artifact                                                                                             | Evidence and action                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REMOVE         | husky 8.0.3                                                                                          | No .husky directory, prepare hook, package script, CI invocation or active command consumer; removed root dev dependency.                                                     |
| REMOVE         | lint-staged 13.3.0 and root lint-staged block                                                        | Its own configuration was the only reference; no hook/script invokes it. Root verification/Prettier remain intact.                                                            |
| REMOVE         | packages/design-tokens/tsconfig.json                                                                 | The package contains CSS only; no TS source/typecheck task/project reference consumes this config. Its formatting lint task and explicit CSS export remain.                   |
| UPDATE         | Active docs, canonical framework skills and generated adapters                                       | Removed whole-project Vite/client-only and missing ui-kit/FSD assumptions; corrected pnpm/workspace examples.                                                                 |
| KEEP           | vite 7.3.6 and @vitejs/plugin-react 5.2.0                                                            | Imported by vitest.config.ts; they run the shared Vitest/RTL runner, not the Next app.                                                                                        |
| KEEP           | eslint-config-react-app and current ESLint/Prettier setup                                            | Active ESLint extends preserve lint/naming/cycle rules; its name is historical tooling, not an SPA runtime. No lint migration or threshold reduction.                         |
| KEEP           | @typescript-eslint/utils 8.72.0                                                                      | Required peer of eslint-plugin-import-x; confirmed with pnpm why, despite no direct app import.                                                                               |
| KEEP           | Root React/react-dom, types, Vitest, RTL, Gherkin/OpenSpec and Playwright tools                      | Actual root test/config/workflow consumers; root React supports RTL, web runtime dependencies remain in apps/web.                                                             |
| KEEP           | Root compatibility aliases                                                                           | start/start:dev/start:local/build:release/test:e2e still forward to working workspace commands.                                                                               |
| KEEP           | .opencode/package.json and its package-lock.json                                                     | Separate pre-existing plugin metadata; not a second application workspace install. Never replaced agent-owned metadata.                                                       |
| DEFER          | MSW                                                                                                  | No Phase 1 HTTP feature/tests yet; retained intentionally as the existing prescribed /test-module HTTP-testing capability rather than removing supported methodology tooling. |
| DEFER          | CRA lint migration, vitest-cucumber optional generator bin, architecture-refactor schema restoration | Existing limitations described below; avoid unrelated upgrades/workflow replacement.                                                                                          |

There is no remaining Vite application config, index.html, old bootstrap, demo component/assets or root npm application lock to delete: Phase 1 already removed those. No hooks, old environment definitions, CONTRIBUTING.md or root PROCESS.md exist; current process lives at docs/PROCESS.md. Files were not removed merely for containing starter/vite/legacy in their name.

Deletion/reference checks found no live consumer of the deleted tokens config. Remaining references to that path are deliberate scope-guard fixtures/allowlist entries and this removal record. Husky/lint-staged references remain only in preserved historical inventories/reports and this cleanup record.

## Dependency and workspace result

Root package.json and pnpm-lock.yaml remove only unused hook tooling. Resolved lock snapshots decrease from 938 to 898: 40 removed, zero new/changed retained snapshot identities. No retained versions or peer compatibility settings changed. Offline install and frozen-lockfile offline install both exit 0. One authoritative workspace manager/lock remains pnpm 8.15.4/pnpm-lock.yaml. Runtime dependencies and workspace:\* boundaries are unchanged.

## Updated files and active guidance

- README.md: current product/setup/stack, real workspace and command table, full preserved workflow-label mapping, architecture and Phase 0/1 links; removed unpack-the-empty-starter instructions.
- AGENTS.md: pnpm orchestration and explicit unchanged-behavior maintenance path; sole-writer/review/testing/Jira rules preserved.
- docs/CODEX.md: English current project setup, explicit $team-\* mapping, generated ownership and inherited read-only permissions; removed old archive-install instructions and obsolete unexecuted-runtime claims.
- docs/PROCESS.md: English current paths/commands and original BDD/TDD, tests-only, baseline, verification, review, archive and commit semantics. Added the narrow non-behavior category required by its previous policy.
- docs/agent-reference/project.md: single authoritative runtime/workspace reference for Server Components, client/browser/secret boundaries, route layouts/errors/loading, locale navigation/metadata, explicit package exports and meaningful test layers.
- docs/agent-reference/anchors.md: English current workspace examples without implying an implemented authentication module.
- docs/STARTER-OPTIMIZATION.md: English historical-status banner only; original report body preserved and no longer presented as current installation guidance.
- .opencode/skills/{react-behavior,react-best-practices,accessibility,team-refactor-safely,spec-bdd-tdd,architecture-refactor}/SKILL.md: targeted architecture/UI/path/pnpm corrections, with generic methodology preserved.
- .opencode/commands/{test-module,change-verify}.md and .opencode/rules/testing-integrity.md: actual mirrored test paths, public package imports and pnpm commands. Existing root tests/ placement is intentional and retained.
- openspec/config.yaml: current Next workspace context instead of a permanent Phase 1-only assumption. Default behavior schema remains frontend-bdd-tdd.
- scripts/architecture-refactor-workflow.mjs, its Node regression tests and scripts/workflow-ci.mjs: scoped maintenance support using existing baseline/final evidence and review machinery. Root test:workflow now includes the previously omitted runner tests.
- .claude rules/commands/skills and .agents/skills: generated from canonical edits; no role/model/provider redesign. Unchanged canonical files accidentally normalized during editing had their original line endings restored.

No changes were needed to .codex/config.toml, specialist definitions, CLAUDE.md, Next/Vitest/Playwright/Turbo configuration, package exports or CI's full verification command. Browser override validation, sequential tests, type strictness, coverage conventions, cycle checks and Jira commit requirements remain intact.

## Maintenance evidence and scope

Owning OpenSpec change: align-phase-one-starter. Its frontend-maintenance schema explicitly declares unchanged behavior and skip_specs: true. It reuses the existing baseline/final runner, ledger hashes, complete-task check, reviewer PASS and final-workspace hash. It is not mislabeled as an architecture migration and does not create product Gherkin/deltas or fake product RED.

The path allowlist rejects app/package source, product tests/specs, Phase 0 and unrelated archived history; readable Git is required. PR checking validates actual PR changed paths, even when checkout HEAD is clean. Maintenance artifacts cannot contain a product test-plan or spec delta. Ten Node guard tests cover schema acceptance, forbidden/allowed paths, clean-checkout PR scope, metadata/delta refusal, portable fingerprints and existing baseline/final freshness. Maintenance fingerprints normalize UTF-8 line endings, sort normalized paths and exclude absent deleted paths so Windows pre-commit evidence matches Linux after commit; binary bytes and actual content changes still invalidate readiness. Existing architecture-refactor raw fingerprints and ordinary behavior gates remain unchanged. Portability assertions failed before this fix and passed afterward (cleanup-portability-red.log).

Original full GREEN baseline passed before tooling edits. New tooling assertions first failed for unsupported maintenance metadata and permissive product-source allowance (cleanup-tooling-red.log), then passed. Recorded cleanup baseline follows bootstrap support. One attempted recorded baseline failed on duplicate YAML preparation/formatting and remains a failed event; it was corrected and followed by successful baseline evidence, never called product RED. Baseline and final use the same command plan.

## Validation commands and results

| Command/check                                                                               | Observed result                                                                                |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| pnpm install --offline --store-dir .pnpm-store                                              | Exit 0; only 40 unused lock snapshots removed                                                  |
| pnpm install --frozen-lockfile --offline --store-dir .pnpm-store                            | Exit 0, lock unchanged                                                                         |
| pnpm agents:sync / pnpm agents:check                                                        | Exit 0, 45 Claude and 58 Codex files, no drift/stale files                                     |
| pnpm test:workflow                                                                          | Exit 0, 30 Node tests (20 existing + 10 baseline/final/scope/portability tests)                |
| pnpm lint / pnpm boundaries / pnpm typecheck / pnpm format                                  | Exit 0, zero errors; cycle checks preserved                                                    |
| pnpm test / pnpm test:ci                                                                    | Exit 0, 21 assertions in six files, including executable control BDD; coverage/JUnit generated |
| pnpm build                                                                                  | Exit 0, all ten localized placeholder routes prerendered                                       |
| pnpm test:e2e                                                                               | Exit 0, 14 installed-Edge browser tests including both BDD flows; no browser download          |
| pnpm spec:validate                                                                          | Exit 0, unchanged stable product spec plus explicitly non-behavior maintenance metadata        |
| pnpm verify                                                                                 | Exit 0 on the cleaned implementation; log ci-reports/cleanup-verify.log                        |
| Targeted Prettier checks, git diff --check, deleted-reference and lock-identity checks      | Pass                                                                                           |
| Git diff for application/package source, product tests/specs, Phase 0 and previous archives | Empty                                                                                          |

The recorded final evidence, independent review and readiness result belong to the owning OpenSpec change (active, or its native archive after completion). Its evidence/architecture-refactor ledger preserves actual command output, exit codes, plan/report/workspace hashes and failed as well as successful events. Raw baseline/tooling logs are in ci-reports. No test assertions were changed to hide failures. Hosted GitHub Actions, physical devices and manual screen-reader testing were not run locally; existing local CI-equivalent verification and Edge journeys were executed.

## Deferred work and remaining issues

The supplied frontend-architecture-refactor schema is still absent; its existing runner/tests/skills are preserved, and PROCESS now explains that schema restoration is required before a future architecture migration. This cleanup does not migrate modules and uses its separate maintenance schema. Existing CRA dependencies emit upstream deprecation notices; vitest-cucumber's optional generator points to a missing published .js filename, while imported scenarios run successfully. Fixing these would require a separate compatibility/dependency task.

Historical Phase 0, Phase 1 inventories/reports and previous archived changes retain their original statements, versions and language. Generic skills and the localized Jira input template are intentionally retained rather than rewritten. Full design system, licensed fonts, auth, database, timer engine and mobile integration remain future product work. No new product functionality or visual/navigation change was made.
