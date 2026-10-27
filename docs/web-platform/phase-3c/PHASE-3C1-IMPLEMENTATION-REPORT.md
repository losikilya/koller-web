# Phase 3C.1 — Profile Management implementation report

Date: 2026-10-27. **Phase 3C.1 implemented and verified; final independent review PASS.** Scope: owner Profile Management only, within active [phase-three-c-profiles-privacy](../../../openspec/changes/phase-three-c-profiles-privacy/). This report is separate from the historical Phase 3C.0 planning/completion report. The multi-stage change is not archived.

## Authorization and starting state

The current explicit implementation instruction accepts D-01–D-03 defaults and D-06 immediate reuse. A renamed/cleared username is immediately available to others, with a visible EN/RU warning, no old-name redirects and stable UUID ownership. The decision register has an appended acceptance record; original planning/history remains intact.

Fresh Git status initially contained only the six existing untracked Phase 3C.0 documents. HEAD was `cb1098f6e695a999d1f32e1e5539043f459edf7b`. No unexpected concurrent change was observed. Existing `align-prettier-lf`, archives, stable specs, SQL migrations/policies and agent configuration are preserved.

## Implemented increment

Profile owns an explicit owner DTO, normalized username/name/bio patch and narrow read/save use cases plus a caller-scoped Supabase adapter. App owns GET `/api/v1/me`, PATCH `/api/v1/me/profile`, verified principal/cookie composition and EN/RU `/account/profile`. The existing account links to My Profile; bootstrap and retry remain in Identity. No additional backend, dependency, state manager or schema migration is introduced. [ADR-0004](../../adr/0004-owner-profile-management.md) records the reviewed boundary.

Owner data excludes email, avatar paths, deletion markers and other-user fields. Profile/privacy revisions are independent decimal strings; explicit text-cast reads and the existing SDK typing seam avoid JavaScript integer rounding. Strong ETags apply to the profile revision only. Existing JWT-owner RPC performs the write; then the service reloads current state. Failure after write is outcome_unknown, requiring explicit reload. No automatic stale retry or atomic-original-commit snapshot is promised.

PATCH requires exact configured Origin, JSON, at most 16 KiB actual streamed bytes, strict fields and strong If-Match. Replies preserve refreshed cookies, no-store and safe stable error codes/request IDs. Handle ASCII-space trim/lowercase, display-name space trim and bio CRLF normalization are server-enforced before canonical patch validation. Existing raw SQL uppercase rejection is unchanged. The editor keeps drafts on validation/conflict/failure, announces feedback, disables duplicate submissions, aborts on unmount and offers explicit reload/cancel. Localized owner metadata is generic/noindex; account HTML and HTTP responses prohibit caching.

## Test and workflow evidence

Fresh full original `pnpm verify`: exit 0 **before production edits**, raw [baseline.txt](../../../openspec/changes/phase-three-c-profiles-privacy/evidence/baseline.txt). It includes real PostgreSQL/Auth/browser acceptance; installed Edge and approved local Docker access were used, without reset/restart/configuration changes.

Planning `workflow check`: exit 0 for six scenarios. The initial check rejected an incidental existing recovery requirement ID in the proposal as unmapped; the explanatory reference was corrected, without weakening the gate. Existing recovery tests remain unchanged.

SC-420 real SQL/REST baseline was recorded before stubs/first GREEN: simultaneous username claims and same-revision edits admit exactly one winner; old handle reuse, anonymous/other-user denial, publication-name guard and decimal-string `9007199254740993` → `9007199254740994` RPC updates were exercised against actual local services. A fixture-only PostgreSQL session setting seeds the large revision; no schema/trigger definition is altered and all created users are deleted afterward.

SC-401, SC-402, SC-405, SC-418 and SC-419 each have actual recorded RED/GREEN/REFACTOR in [the ledger](../../../openspec/changes/phase-three-c-profiles-privacy/evidence/ledger.json): absent service behavior, HTTP 503 instead of owner success and missing labelled editor controls failed before implementation; the same tests passed afterward. No import/setup failure was counted as RED. Only after each complete cycle were test files mechanically formatted; archived report/event bytes remain untouched. Full-gate reruns verify current formatted tests.

Typecheck and lint/boundaries outside the sandbox: exit 0. A prior sandbox-only typecheck attempt failed on SWC native-cache access; no dependency reinstall or configuration relaxation was used. First final verify exited 1 on formatting of one new test; its log is retained. After correction, second full verify exited 0, including 62 tests plus coverage, real PostgreSQL/Auth, 22 app browser checks (including owner-profile SSR/no-JS/locale/keyboard/reflow/axe), seven Storybook checks and strict specs 6/6. This is the actual pre-review-correction result, not fresh acceptance of later fixes.

### Independent review corrections

Read-only review pass 1: BLOCKED on executable unit Gherkin (HIGH), uncertain SDK save/Cancel behavior (MEDIUM) and ineffective eligible publication race (MEDIUM). The original feature existed before RED but initial direct unit assertions did not load it. Current same-path drivers now execute its exact steps via loadFeature/describeFeature with explicit per-driver tag partitions; browser Gherkin already ran through playwright-bdd. No original TDD reports, events or baseline results were rewritten or retroactively described as Gherkin execution.

The post-implementation ordinary lost-RPC regression first failed then passed with thrown-write handling. Review additionally reproduced the SDK's resolved status-zero/empty-code error shape and Cancel bypass: two ordinary assertions failed before correction and the unchanged two passed afterward. The adapter now classifies indeterminate transport/server failures as outcome_unknown; the editor retains reload-required independently of feedback/Cancel until a successful GET. A separate ordinary real SQL regression seeds an eligible nonblank name before racing publication/clearing and checks exactly one success plus the final invariant. The initial baseline script remains unchanged. Combined current executable Gherkin/SQL acceptance passed 7 tests in 4 files; raw logs are in the change evidence directory.

The first review-corrected full attempt stopped at formatting two test files; that failed log is preserved. After correcting them and explicitly passing root format, **fresh full `pnpm verify` exited 0**. Raw [final verification](../../../openspec/changes/phase-three-c-profiles-privacy/evidence/final-verify-reviewed-formatted.txt) and [acceptance manifest](../../../openspec/changes/phase-three-c-profiles-privacy/evidence/acceptance-manifest.json) retain actual results and content digests:

- Agents and 72 workflow checks, lint/boundaries, strict TypeScript and formatting passed.
- Vitest: 64 tests in 22 files, then the separate coverage run passed with configured thresholds unchanged.
- Real database: 70 pgTAP checks plus signed-JWT REST/RLS; the Profile database suite additionally passed two tests, including lossless bigint/concurrent claims/edits and the eligible publication/name-clear race.
- Real Auth/Mailpit: two integration tests passed; generic recovery regression remains intact.
- Next/Storybook builds passed; valid Turbo workspace caches were used where reported.
- Edge application acceptance: 22 browser checks passed, including localized owner editing, no-JS SSR, protected guest access, no-store/metadata, keyboard focus, reflow and axe.
- Storybook interactions/accessibility: seven passed. Strict OpenSpec: 6/6 passed.

Independent correction review pass 2: **PASS**, all three findings resolved and no new actionable findings. The [actual reviewer response](../../../openspec/changes/phase-three-c-profiles-privacy/evidence/review-pass2.txt) and [review record](../../../openspec/changes/phase-three-c-profiles-privacy/review.md) distinguish direct reviewer inspection from main-session test execution/hash checks. Main-session integrity verification matched all 16 original report/event hashes and their Git provenance, plus exact original baseline log bytes. Protected archive/spec/SQL/agent-config/lockfile paths have no diff. A final scoped formatting/link/evidence/readiness check follows record-only updates; no production source changed after the successful full run.

## Completion and handoff

Completed: accepted decision record and compatible ADR, owner contracts/service/adapter, protected HTTP, EN/RU profile route/editor, bootstrap recovery integration, executable acceptance drivers, meaningful real concurrency/large-revision guards, recorded behavior cycles, review corrections and full local acceptance. No known actionable finding remains in the reviewed 3C.1 scope. `pnpm workflow ready phase-three-c-profiles-privacy` exited **0**, `ready: true`, six mapped scenarios; the [actual readiness output](../../../openspec/changes/phase-three-c-profiles-privacy/evidence/ready.txt) is retained. This readiness covers the scoped 3C.1 increment only; deferred stages are not represented as completed functionality. The active change is not archived.

Final record-only checks exited 0: explicit Phase 3C/ADR formatting, agents sync/check (zero generated changes/drift), strict specs 6/6 and repeated increment readiness. All 37 local Markdown links across 13 planning/change/ADR documents resolve. Ten retained verification logs, 35 final source/test hashes and all 16 original event reports matched their recorded digests; actual ready/reviewer references are included in the acceptance manifest. No production source changed after the final full GREEN.

## Deferred scope and verification limits

Phase 3C.2 privacy mutation UI/public username pages, 3C.3 avatars/Storage and 3C.4 combined acceptance remain deferred. No public profile page, bucket/policy/upload, social/community/event/battle feature, new OAuth provider or account-deletion orchestration is implemented. No commit, push, deployment, destructive reset or external credentials/service change.

Local tests do not certify live Google OAuth, external SMTP, remote CI or future Storage acceptance. Automated accessibility and keyboard browser checks do not imply a manual NVDA certification. Increment readiness cannot be described as completion of the later Phase 3C stages.
