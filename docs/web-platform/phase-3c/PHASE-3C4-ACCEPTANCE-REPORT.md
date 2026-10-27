# Phase 3C.4 — Integrated Local Acceptance

Date: 2026-10-28 (Asia/Qyzylorda). Base: `524ef172acc8d327ba5591adfa76a8abefa80cba`, branch main; initial worktree/index clean, locally two commits ahead of origin/main without fetching. Scope is local acceptance only. The previous one-off commit permission was consumed by Phase 3C.3. No further commit, push, amend, deployment, database reset, production/external setting change, automatic archive or next-phase work is authorized or performed here.

## Accepted product contract and integration scope

Phase 3C.1 owner editing, revised 3C.2 mandatory completion/public presentation and 3C.3 optional avatars are exercised together. Required username and display name establish explicit completion; completed profiles remain public. Incomplete authenticated accounts remain gated, while guests and essential login/callback/recovery/logout/bootstrap routes retain their exceptions. UUID identity stays stable; old usernames are immediately reusable with an owner warning and no redirect history. All profile presentation remains noindex/nofollow/no-store.

The original planning alternatives for optional publication, hide controls and indexing are superseded by accepted revised 3C.2. They are not missing features. Discovery foundations remain internal; no catalog/activity/social feature is added. Local avatar policy remains exact 2 MiB input with visible EN/RU 2 MB guidance and oversize error before upload, authoritative server content/decoder bounds, private Storage and controlled current-image URLs. Pending work expires at 24 hours; successful cleanup records remain seven days after confirmed deletion; failures remain durable. No new schema, dependency or architecture boundary is introduced.

## Historical preservation and stage baseline

Before prospective edits, all 327 Phase 3C.3 acceptance entries matched. The new `evidence/phase3c4/history-manifest.json` pins 272 prior tracked planning/report/evidence files, nine exact active-artifact snapshots and eleven original commit-proof files. Original 3C.0–3C.3 reports/manifests and committed byte proofs remain unchanged. All 51 ledger events/report hashes are preserved; no acceptance GREEN is labelled retroactive RED or wrapper baseline.

Fresh full `PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm verify` stage baseline exited **0** (`evidence/phase3c4/baseline.txt` and baseline-exit.txt) before adding new executable tests or changing production code. It passed 95 tests with coverage, real PostgreSQL/RLS/Auth/Storage/worker/races, builds and browser-asset isolation, 24 app-browser examples, seven Storybook/a11y examples and strict specs 6/6. Prospective planning records do not change these existing product contracts.

## Requirements, scenarios and actual test layers

`evidence/phase3c4/acceptance-map.json` maps FR-401–414 to all 17 existing canonical scenarios, their unchanged focused drivers/features and the real root commands. Existing original recorded TDD remains the implementation evidence. New ordinary acceptance in `tests/e2e/profile/integration.feature` has no change/FR/SC tags and does not invent new requirements or historical evidence. A read-only test_designer directly identified the joins missing from the separate original journeys; its actual response is retained in test-design.txt.

- ACC-01, EN/RU: an incomplete owner enters mandatory fields and optional bio, uploads an avatar, retains drafts, and uses the new revision to complete by keyboard. Owner image access is 200 and guest access 404 before completion; the same controlled URL becomes guest-readable afterward. Rename preserves UUID/avatar; the old route is initially 404 without redirect, then a second owner claims it without inheriting the first avatar. Guest no-JavaScript EN/RU SSR, canonical/robots/no-store, RSC leaks, compact reflow/reduced motion and axe are checked.
- ACC-02: two real editors share one revision. An avatar write in one makes the other's text PATCH stale. Actual 412 retains the draft and focuses the error without overwriting server text; explicit reload adopts the current avatar/revision and permits the subsequent save.
- Existing layers cover the independent size/format/pixel partitions, raw Storage/RLS/grants, arbitrary-owner denial, bigints, duplicate/visibility/completion/public-read races, idempotency, rates, 24-hour expiry, seven-day retention, failed cleanup/fencing/restart/late orphans, Auth/Mailpit, manipulated routes/history, bootstrap recovery and uncertain-write cancellation. These are real existing root commands, not substituted by new mocks.

The first focused browser invocation omitted the existing local runtime launcher, so login correctly reported provider unavailability. Its replacement initially assumed npm_execpath existed under pnpm exec and failed before tests. Both setup failures remain preserved and are not product RED. The final focused launcher resolves the installed official Playwright CLI and uses the existing loopback-only in-memory local configuration; no key or CLI status dump is persisted. Russian fixture messages were corrected to the existing accepted product strings without weakening assertions.

## Discovered regression and minimal correction

ACC-01 passed in both locales. ACC-02 genuinely failed: a stale text PATCH returned 503 instead of the existing 412 conflict contract. A separate actual local PostgREST probe confirmed HTTP **500** with SQLSTATE **40001** after a definite revision rollback. The persistence adapter had classified every HTTP 5xx as uncertain before the service could map this known SQL code.

Before production correction, new ordinary MSW tests using the actual Supabase SDK failed **2/4**, for edit and completion, with revision_conflict/412 expected but outcome_unknown/503 received. The two unknown-error controls passed. `profileRepository.ts` now exempts only SQLSTATE 40001 from the blanket transport-uncertainty classification, for both operations. Service mapping, schema, RPC signatures and boundaries are unchanged. Other unknown HTTP 500 errors still require uncertain-outcome reload. This restores FR-402/406 rather than introducing a new contract. No architect/schema decision is needed for the local error-classification correction.

Unchanged regression assertions then passed: the focused GREEN passed six tests including the uncertain-write guards; the full Profile refactor regression passed 22 tests in ten files. The original integrated browser reproduction passed all three examples against a fresh build (integration-conflict-fixed.txt). Logs include repository-conflict-red.txt, repository-conflict-green.txt, conflict-refactor-regressions.txt and actual-postgrest-conflict.txt. No original ledger report or tagged cycle is rewritten.

## Types, isolation and accessibility limits

Actual public database types are regenerated locally and compared after repository formatting, including nullable completion/avatar columns. No reset, migration, manual type fabrication or remote schema is used. Root verify explicitly runs db:test, db:test:profile, db:test:completion, db:test:avatars, test:auth, builds, avatars:check-client and real browser suites. The latter checks the actual private key bytes and variable name in built browser js/maps; source server-only boundaries remain outside the client graph. Raw Storage paths/keys and private profile columns are excluded from guest HTML/RSC and safe DTOs.

Automated actual-browser keyboard activation, focused status/error feedback, compact reflow/reduced motion and axe complement existing control tests. **Manual screen-reader speech verification was not run.** NVDA was not on PATH, running or found at the two checked standard Program Files locations (screen-reader-availability.json); portable/custom installations were not exhaustively searched. No manual NVDA, spoken-announcement or WCAG certification is claimed. Automated keyboard checks are identified as automation, not a human manual pass.

## Final verification and independent review

Final full `PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm verify` exited **0** after the production correction, focused regression/build/browser checks and the strengthened real RSC assertions. Actual log: `evidence/phase3c4/verify-final-first.txt`, SHA-256 `abbedb9b480ec8520a7c8eacbc82543d7cf7d09fd5e4013246cb4fa45fa58849`; actual exit file: verify-final-first-exit.txt.

- Agent consistency and 72 workflow tests, lint/boundaries, strict types and formatting passed.
- 99 tests in 39 files passed; all 99 passed again under coverage.
- Real PostgreSQL passed 74 pgTAP checks plus signed-JWT REST/RLS; Profile/completion/public-read races, actual Storage/cleanup/fencing/restart and two Auth/Mailpit tests passed.
- Next and Storybook production builds passed; the actual private key and server variable name were absent from all 17 built browser assets.
- All 27 app-browser examples passed in Edge, including the three new combined examples and their real RSC 200/text-x-component checks; all seven Storybook/a11y examples passed; strict specs passed 6/6.

The current-source pin contains 239 source/config/test files. Only one preexisting production file changed (three lines in profileRepository.ts), with three new test files. The initial evidence inventory accidentally omitted unchanged .prettierignore; the original 238-file selection is retained and the expanded pin unions all prior accepted source paths. This corrected inventory metadata, not source bytes. Mapping/source-delta and historical validation remain separate from independent reviewer inspection.

Actual independent read-only review pass 1: **PASS**, no actionable findings. The full original response is retained in `evidence/phase3c4/review-pass1.txt`. It directly covers the diff, three new test files, mapping/artifacts/report/handoff and actual regression/final logs; no commands/tests/network were run by the reviewer. Complete main-session historical/source hash checks are distinguished from its direct inspection. No prior increment's PASS is reused.

The final current-source/evidence manifest binds all 239 current source/config/test files, active planning/review/tasks, this report/handoff, actual logs/exits and the historical manifest. Main-session validation confirms 272 historical files through their nine explicit active snapshots, eleven unchanged commit-proof files and all 51 original ledger/report hashes. Current source remains equal to the final-run pin. `pnpm workflow ready phase-three-c-profiles-privacy` exited **0**, reporting **17 scenarios, ready=true** after all verified tasks were completed (`evidence/phase3c4/workflow-ready.txt`). No archive action is implied.

## Integration handoff and remaining limits

Local commands remain `pnpm dev:local`, `pnpm avatars:cleanup`, `pnpm db:test:avatars`, `pnpm build:local`, and `PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm verify`. Cleanup is a bounded authenticated manual local pass; rerun after restart or reported retry/backoff. Production scheduling/monitoring/operator ownership and deployment credentials remain undecided. Local callback/Auth/Mailpit acceptance does not certify live Google OAuth, external SMTP or remote CI. Previously downloaded/in-flight image bytes cannot be recalled.

Local Phase 3C technical acceptance is complete, with the limitations above. The active change remains **unarchived** and is ready to present for a separate explicit owner archive decision. No archive approval, production readiness or Phase 4 authorization is inferred. No new product work follows this handoff automatically.
