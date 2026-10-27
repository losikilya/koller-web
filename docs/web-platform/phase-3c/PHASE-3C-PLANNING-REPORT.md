# Phase 3C.0 — User Profiles & Privacy Planning Report

Initial planning: 2026-10-26. Final verification and completion: 2026-10-27. **Phase 3C.0 complete. Planning only; Phase 3C.1 has not started and is not authorized.** Documentation is English; no application code, SQL migration, dependency, policy, stable spec, archive or agent configuration is changed. No reset, commit, push or deployment was performed.

## 1. Executive summary

The repository already has a secure Profile/Privacy persistence foundation: private defaults, owner SELECT RLS, revoked direct product DML, JWT-derived revisioned write RPCs and restricted public projections. Basic profile editing can reuse it without a migration if current immediate handle reuse is accepted; reservation would require an additional migration. The missing work is owner/profile UI and HTTP contracts, a username public projection and localized SSR routes, indexing/privacy metadata, and the complete avatar Storage lifecycle. A new backend or state manager is unnecessary.

Recommend one future OpenSpec behavior change, implemented sequentially as 3C.1 Profile Management → 3C.2 Privacy & Public Profiles → 3C.3 Avatar Management → 3C.4 Acceptance & Integration. This report does not scaffold or implement that change. Blocking product/architecture decisions are explicit below; privacy and test obligations precede implementation.

## 2. Confirmed Phase 3B state

[Phase 3B implementation report](../phase-3b/implementation-report.md) ends complete and natively archived at `openspec/changes/archive/2026-10-26-phase-three-b-authentication`. Archived design/test-plan/review and acceptance files exist; stable `user-auth` and `platform-shell` specs include its contracts. Its historical final review is PASS and workflow ready=true. The report records full local verify exit 0: 72 workflow checks, 55 unit assertions plus coverage, 70 pgTAP and actual signed-JWT REST/RLS, two Auth/Mailpit tests, 21 app-browser and seven Storybook checks, builds/types/lint/format/agents/specs. Eight real TDD cycles/24 events remain archived. This audit did not rerun those historical checks or independently recalculate the entire archive's hashes.

The later archived `normalize-password-recovery-feedback` is also present with PASS review and full acceptance manifest. Current `modules/identity/authService.ts::recoverPassword`, `tests/apps/web/modules/identity/recovery.test.ts` and stable user-auth FR-303/SC-309 agree: every valid recovery request returns generic pending, including provider errors/throws, while validation and provider enforcement remain intact. No auth decision is reopened. Live Google, external SMTP and remote CI remain unverified.

Phase 3A is likewise archived per the final section of its report; its narrowly approved historical evidence exception remains historical, not a template for bypassing future RED/GREEN/REFACTOR.

## 3. Actual Profile/Privacy architecture

`supabase/migrations/20261026000001_identity_schema.sql` defines profiles (UUID owner, nullable lowercase handle, name/bio/path, revision/lifecycle), profile_privacy (private/false/false, revision), user_preferences (locale/theme, revision) and unrelated playground storage. Owner-only SELECT RLS plus grants protect all four. Direct product writes are revoked.

`20261026000002_identity_access.sql` implements transactional `ensure_profile`, `update_own_profile`, `set_own_privacy`, preferences writes and UUID public exact/list readers. `lock_owner` serializes mutation on the profiles row; profile/privacy revision counters remain independent. Public exact lookup ignores discoverable but requires public visibility, a privacy row and no deletion marker. Discovery additionally requires discoverable=true. `dance_profile_reader` owns the public functions, cannot login/bypass RLS or read avatar_path, and returns only user_id/username/display_name/bio.

`packages/contracts/src/identity.ts` has strict profile/privacy schemas and public DTO with avatarUrl fixed to null. SQL rejects uppercase; application normalization does not yet exist. There is no owner result/error/ETag contract. `shared/supabase/database.ts` preserves nullable usernames over generated metadata. Identity owns verified bootstrap; app owns Next cookies/HTTP, and shared Supabase forces request isolation/no-store. `/account` currently displays verified email/bootstrap status, not editable profile fields. No `modules/profile` or username pages exist.

EN/RU routing uses next-intl, mandatory locale prefix, explicit SupportedPath catalog and shell language-switch composition. Dynamic username continuity requires a typed extension. Phase 2 exports usable Input/Button/Card/Badge/Container/LoadingIndicator/EmptyState/Dialog/Tabs; textarea/file/radio/checkbox remain native module controls unless reuse justifies shared primitives. Storage is explicitly disabled in supabase/config.toml; no checked-in bucket, policies or avatar implementation exist. These are repository facts, not a remote-project inventory.

## 4. Gap analysis

| Confirmed scope                      | Existing                                                     | Required future work                                                                                              |
| ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Own profile/edit                     | Tables, constraints, update RPC, active-owner lock           | Owner DTO/read, form normalization, same-origin API/ETags/errors, localized UI and races                          |
| Privacy settings                     | Private defaults, privacy RPC/revisions, discovery filtering | Owner settings UI/API, publication UX, no stale cache and direct-RPC regression                                   |
| `/en/u/:username`, `/ru/u/:username` | UUID public reader only                                      | Additive username projection, safe indexability signal, SSR metadata/canonical/404 and route continuity           |
| Avatar lifecycle                     | Reserved internal avatar_path only; public URL null          | Private bucket, bounded image processing, revisioned association, opaque delivery and durable cleanup             |
| Acceptance                           | SQL/RLS/Auth/browser/a11y foundation                         | Executable Profile scenarios and genuine future TDD, real concurrent writes and Storage security/failure recovery |

## 5. Required database, API and UI changes

Propose `modules/profile` with small use cases, policy/DTO mapping, injected persistence port and Supabase adapter. App coordinates verified Identity public API and Profile, owns thin `/account/profile`, `/account/privacy`, `/u/[username]` routes and `/api/v1/me` profile/privacy/avatar adapters. RSC calls server APIs directly; client forms call versioned locale-neutral HTTP. No app/Identity-private imports from Profile, generic CRUD framework or persistent auth/profile store.

3C.1 can reuse current SQL if constraints and reload-current response semantics are accepted. Add strict normalized input, own/privacy DTOs and lossless conditional revisions; HTTP 409 for username unavailable, 412 stale, 428 missing precondition, explicit validation/auth/service errors. Existing void RPC plus subsequent read does not guarantee an exact original commit snapshot. Keep active-account checks in owner readers: SELECT RLS alone does not filter deleting rows.

3C.2 requires a new restricted username projection migration; preserve existing UUID/list readers. Propose a computed page-only indexable signal instead of exposing private privacy rows. Keep no-store for public/owner HTML, JSON, metadata/errors and images; no ISR or shared profile cache. New dynamic routes must preserve handles during EN/RU switch. Existing auth return allowlist is not expanded indiscriminately. Public data/metadata come from the same authorized whitelist. No search/catalog UI is required to prove non-discoverable exclusion.

3C.3 requires future bucket/Storage policy and association/ledger migrations, local Storage enablement without reset, regenerated types and approved avatarUrl schema evolution. No old migration is rewritten. All UI states/text/metadata use EN/RU module messages and existing design tokens, semantic native controls and accessible feedback.

## 6. Storage design rationale

Use a private bucket and server-mediated immutable uploads; deny anon/authenticated direct raw object operations. Validate actual bytes, decoded type/dimensions/pixels and re-encode to strip metadata; proposed ≤2 MiB JPEG/PNG/WebP input and bounded WebP output need approval/runtime verification. Existing avatar_path cannot be set through general profile PATCH.

Expose only opaque application avatar URLs. A confined server-only storage capability and service-only locator RPC check current pointer, active account and public visibility or separately verified owner before bytes are streamed; no public bucket/path or reusable signed URL. Keep privileged capability outside browser/client imports and ordinary profile persistence; review its broad credential risk explicitly. Bypass image optimizer/CDN caching for privacy-dependent bytes.

Upload is not atomic with PostgreSQL: record pending work before storage write, associate through caller-JWT compare-and-swap, transactionally enqueue obsolete-object cleanup, then process durable retries/reconciliation. Remove clears the pointer before deleting bytes. Stale retries cannot delete a current avatar. Cleanup references survive Auth-row deletion long enough for orphan recovery, without implementing full account deletion orchestration. A real authenticated scheduler/runner and retention owner must be selected before 3C.3; a finally block is insufficient.

## 7. Privacy risks and testable defenses

Private/missing/deleting/missing-privacy direct URLs must be indistinguishable to all public callers, including owners; no owner preview on public routes. Real grants/RLS/REST tests cover forged owner/path fields and cross-user operations. Existing case-insensitive uniqueness plus canonical validation arbitrate concurrent claims. Generic save conflict still reveals handle unavailability; no constant-time or zero-enumeration promise is made. No bulk availability endpoint is planned.

Non-discoverable public means direct-link access but no platform discovery and noindex; crawlers are not authorization. Metadata/HTML/RSC/headers are inspected for email/path/revision leaks. Current-handle canonical URLs preserve UUID identity; rename/reuse risk needs owner decision. No-store prevents new shared cache copies, but in-flight/already downloaded/external copies cannot be recalled. Image endpoint rechecks current privacy and reference; real Storage tests prove raw denial, upload limits, concurrent replace/remove and crash cleanup. Profile/privacy share a row lock but independent revisions: publishing a specific reviewed snapshot is not currently guaranteed.

## 8. Sequential implementation and test workflow

3C.1 delivers owner reads/editing; 3C.2 publication and public pages; 3C.3 avatars; 3C.4 combined acceptance. Each stage has explicit preconditions, files, migration needs, acceptance, risks/dependencies and independent-review requirements in [the implementation plan](00-implementation-plan.md).

After separate implementation authorization and decisions, obtain installed OpenSpec artifact instructions and create one frontend-bdd-tdd change. Canonical Gherkin maps requirements to focused Vitest drivers and real browser scenarios. Record existing guards as justified baseline before implementation; new UI/API/projection/storage behavior needs actual assertion RED → unchanged-test GREEN → REFACTOR. Database and Storage acceptance are real commands, not simulated security evidence. Run full pnpm verify sequentially plus new Storage/type-reproduction checks, manual critical accessibility checks, independent requirements/engineering review (maximum two passes), then workflow ready and owner acceptance. Archive/commit/deployment require their applicable authorization.

## 9. Unaccepted decisions and architecture consultation

Before 3C.1: D-01 route/change scope, D-02 normalization/lossless revisions, D-03 reload-current/independent revision semantics and D-06 old-handle reuse/reservation. Before 3C.2: D-04 null-handle publication/name rules and D-05 canonical/indexing signal. Before 3C.3: D-07 image budgets/decoder, D-08 privileged storage boundary, D-09 durable ledger/retention and D-10 scheduler/abuse control integration. Details and alternatives are in [open decisions](04-open-decisions.md).

Actual read-only architect consultation confirmed this is a minimal modular-monolith extension; no migration of Identity/bootstrap is required. It confirmed existing row locking/revisions, new username/Storage migrations and null-only avatar contract, and highlighted old-handle reuse, post-write read races and durable cleanup. ADR impact NONE for 3C.0; a NEW implementation ADR is recommended when Profile/storage capability ownership is adopted, with no currently justified supersession of accepted principles.

## 10. Files created in Phase 3C.0

- [00-implementation-plan.md](00-implementation-plan.md)
- [01-current-state-audit.md](01-current-state-audit.md)
- [02-privacy-and-security-design.md](02-privacy-and-security-design.md)
- [03-acceptance-scenarios.md](03-acceptance-scenarios.md)
- [04-open-decisions.md](04-open-decisions.md)
- [PHASE-3C-PLANNING-REPORT.md](PHASE-3C-PLANNING-REPORT.md)

## 11. Validation results

Initial worktree was clean at HEAD `cb1098f6e695a999d1f32e1e5539043f459edf7b`; read-only OpenSpec inventory exit 0 showed only unrelated `align-prettier-lf`. Pre-write `pnpm agents:check` exited 0 (Claude 45/Codex 58, no drift); `pnpm spec:validate` exited 0 (5/5, including stable specs and unrelated maintenance). These are a scoped documentation-planning baseline, not a full product GREEN or future implementation baseline.

The initial `pnpm verify` attempt exited **1** before checks: local-auth-environment could not obtain running local Supabase status (`Local Supabase must be running; use pnpm db:start`). On 2026-10-27 the underlying access issue was reproduced: Docker's named pipe returned Access is denied inside the sandbox; the same read-only Docker version check outside the sandbox succeeded (server 20.10.22). This was an environment-access failure, not product RED. No database reset, service restart or configuration change was needed.

Scoped checks passed: explicit `pnpm exec prettier --check docs/web-platform/phase-3c` exit 0 (six documents); local Markdown-link check exit 0 (27 links, zero broken); `pnpm agents:sync` exit 0 (zero adapter files updated), `pnpm agents:check` exit 0 (zero drift), `pnpm spec:validate` exit 0 (5/5), tracked `git diff --check` exit 0. Tracked diff was empty; untracked inventory contained exactly the six requested documents.

On 2026-10-27 **full `pnpm verify` exited 0**, with approved access to the existing local Docker services and `PLAYWRIGHT_BROWSER_CHANNEL=msedge` for the installed browser. The unchanged root gate ran sequentially:

- Agent consistency and 72 workflow tests passed.
- Lint/boundaries, strict TypeScript and existing formatting checks passed; Turbo reused valid cached workspace tasks where reported.
- Vitest passed 56 tests in 17 files; the separate coverage run also passed all 56 and its configured thresholds.
- Real PostgreSQL passed 70 pgTAP checks and anonymous/owner/non-owner signed-JWT REST/RLS assertions.
- Real local Auth/Mailpit integration passed two tests.
- Next production build and Storybook build passed.
- Application browser acceptance passed 21 tests in Edge; Storybook interaction/accessibility acceptance passed seven tests.
- Strict OpenSpec validation passed 5/5.

Exact raw completion log: `C:/Users/Lenovo/AppData/Local/Temp/phase-3c0-verify-20261027.log`; SHA-256 `cbff150dd6fd84cf374e8637b992d3b951e11833c984b96cc973cdcacdb0fba9`. This is a current unchanged-product GREEN for planning completion, not the future Phase 3C implementation's preimplementation baseline or TDD evidence. Historical Phase 3B results remain separate. Storage is still disabled; no avatar/Storage acceptance is claimed. Live Google, external SMTP and remote CI remain outside this local verification.

Independent read-only review pass 1: **PASS**, no BLOCKER/HIGH; one actionable MEDIUM identified a misplaced old-handle reuse decision gate. D-06 has been moved before 3C.1 across the plan, decision register and readiness/report, because rename already ships there. If reservation is selected, 3C.1 now explicitly requires its migration. Independent correction review pass 2: **PASS**; the MEDIUM is resolved and no new actionable findings remain. The reviewer directly inspected all six documents and relevant source/contracts/rules in pass 1, then the three corrected documents and Git scope in pass 2. The reviewer ran no tests/scripts/network; command results belong to the main session, and no whole-archive hash recalculation or future product acceptance was claimed.

The root format script currently lists phase-1 through phase-3b, so Phase 3C documents require a separate explicit Prettier check; planning does not edit that root script.

## 12. Readiness to begin Phase 3C.1

**Phase 3C.0 is complete:** all six planning deliverables exist, independent review is PASS, scoped documentation checks pass, and the full current local verification is GREEN. No remaining verification blocker is known for this planning-only scope.

**Phase 3C.1 is not started; it awaits separate implementation authorization and acceptance of D-01–D-03 and D-06.** These are decisions for the next phase, not unfinished 3C.0 implementation tasks. Future original GREEN/workflow/BDD/TDD gates must still be satisfied before implementation; this current verification must not be relabelled as their evidence. No Phase 3C archive or implementation is performed by this handoff.
