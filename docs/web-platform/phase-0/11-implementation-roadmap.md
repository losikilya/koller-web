# Implementation Roadmap

Phase 0 ends with documentation. This roadmap authorizes no implementation in the mobile checkout. Future work occurs in a separate repository with OpenSpec + BDD + TDD and ADR review. Mobile rule prohibiting unrequested tests still applies here; future web testing is explicitly part of the accepted process.

## Existing workflow assessment

Verified `AGENTS.md`, `CLAUDE.md`, `docs/DEVELOPMENT_WORKFLOW.md`, `docs/CODEX_TASKS.md` and `.codex/config.toml`; no existing OpenSpec directory/configuration or orchestration scripts found. `.agents/` is empty. CLAUDE describes a graph integration but no callable graph tool is available. No OpenSpec artifact is created. Future repo should adopt OpenSpec without rewriting mobile rules, and record spec approval, scenarios, tasks and acceptance evidence per change. Exact current OpenSpec CLI/workflow compatibility must be checked at adoption, not inferred from this checkout.

## Phase 1: Repository foundation and design primitives

- Preconditions: Phase 0 accepted; new repo destination; owners confirm versions/dependency approvals, asset/font rights or fallback, region/hosting direction and future agent rules.
- Scope: separate pnpm/Turbo structure from ADR-002; Next.js/TypeScript; initial explicit import boundaries; locale routing/namespace resources; tokens and core accessible controls; CI skeleton; OpenSpec/ADR workflow.
- Non-goals: migrating Expo, cloud production setup, account/profile/preset business flows, battle code, NestJS, microfrontends or working timer.
- Deliverables: foundation spec with BDD; checked-in ADRs; reproducible version-pinned workspace; packages with minimal justified exports; en/ru shell; visual component review using extracted tokens; test tooling.
- Acceptance: clean install/build in new repo; / -> /en; /en and /ru shell; keyboard/focus; no RN dependencies or forbidden imports; environment schema without committed secrets.
- Tests: Vitest pure modules, React Testing Library primitives, Playwright route/reflow smoke, automated accessibility + manual keyboard; typecheck/lint/build/import enforcement.
- Dependencies: compatibility review for Next/React/next-intl/Supabase SSR/tooling; dependency installation approved only in new repo.
- Risks: font/Cyrillic mismatch, overbuilt packages, middleware/version mismatch.
- Recovery: revert new-repo foundation commits or redeploy previous artifact; mobile is unaffected.

## Phase 2: Identity, profile and privacy foundation

- Preconditions: Phase 1 gates pass; deployment origins/OAuth/email provider configured for isolated development/staging; schema/OpenSpec/privacy review accepted.
- Scope: Supabase Auth, email verification/recovery and Google PKCE; SSR principal; transactional profile bootstrap; tables/constraints/RLS/grants/functions; private defaults; owner profile/privacy/preferences and controlled public projection; account deletion recovery.
- Non-goals: Community/Events/Battles, participant import/linking, public activity, broad profile search, required avatars or custom auth.
- Deliverables: reviewed migrations in new repo; OpenAPI identity/profile contracts; auth adapters and focused use cases; localized auth/profile UI; adversarial policy suite; deletion/restore runbook.
- Acceptance: unverified/recovery/invalid callback handled; private data denied beyond UI; non-discoverable public exact lookup works and listing excludes it; owner-only mutation; no service keys in client; sign-out/account switch isolation.
- Tests: BDD auth/privacy scenarios, provider staging integration, direct anonymous/owner/non-owner REST/RPC RLS tests, concurrent bootstrap and username uniqueness, callback/CSRF/cache tests, deletion retry/restore, Playwright EN/RU auth and profile.
- Dependencies: Phase 1 shell/contracts; verified Supabase configuration; DNS/SMTP/provider ownership.
- Risks: linking takeover, email deliverability, definer/grant mistakes, token revocation delay and deletion partial failure.
- Recovery: disable publication/writes using server configuration; preserve private defaults; rollback application with expand/contract migration strategy; idempotent deletion retries.

## Phase 3: Playground and guest Practice Timer

- Preconditions: foundation and visual primitives accepted; Timer proposed bounds, zero-rest/final-rest and suspension policy approved in OpenSpec. Phase 2 auth is not required to implement isolated guest core, but cloud work waits for it.
- Scope: manifest registry/catalog and lazy route; independent pure timer core; clock/audio adapters; responsive EN/RU UI; guest configuration and local presets; reload/failure behavior.
- Non-goals: cloud preset saving/import, session recovery after reload, alarms while browser is closed, battle timer migration, native sync.
- Deliverables: timer module and pure fixtures; locale resources; local adapter; accessible controls/preset dialogs; browser limitation notes; BDD scenarios from [09](09-practice-timer-specification.md).
- Acceptance: guest uses full timer without login; elapsed time independent of callback counts; pause/resume/reset and exact boundaries correct; local preset reload works; unsupported audio/storage failures graceful; no unrelated imports.
- Tests: TDD pure state/time edge cases; adapter/component integration; Playwright EN/RU compact/wide, keyboard and preset flows; manual suspended-device/audio matrix.
- Dependencies: Phase 1 UI/tokens/routing; sound choice/rights; browser support matrix.
- Risks: browser clock suspension differences, active navigation loss, local multi-tab conflicts and audio restrictions.
- Recovery: disable sound/unsupported persistence enhancement independently; preserve guest records; versioned local data migrations with recovery/export.

## Phase 4: Authenticated persistence and guest import

- Preconditions: Phases 2 and 3 accepted; data budgets/concurrency/import rules approved; schemaVersion=1 contracts ready.
- Scope: owner preset APIs and RPCs; atomic quotas, revisions and conditional writes; account-scoped drafts; explicit import preview/dedup/retry; cross-device save.
- Non-goals: automatic sync/overwrite, cloud timing, active session sharing, cross-app data access or running-session history.
- Deliverables: cloud adapter, contract schemas/OpenAPI, validated JSONB migrations, optional import UI, failure/conflict/retry controls.
- Acceptance: guest core remains ungated; import never overwrites by name; partial failures recover; other owners/forged IDs/versions/sizes denied directly; no stale-account replay; concurrent quota overflow blocked.
- Tests: TDD preset/import use cases, both adapter contract suites, direct DB ownership/quota/concurrent-write integration, Playwright guest->sign-in->import and second-device conflicts, EN/RU accessibility.
- Dependencies: Phase 2 principal/DB; Phase 3 presets; BFF contract error/revision semantics.
- Risks: ambiguous network outcomes, duplicated imports, local account leakage, silent overwrite.
- Recovery: disable cloud writes/import while preserving local timer and cloud records; schema/backfill compatible with previous release; retry mapping retained per account.

## Phase 5: Release readiness and measured growth

- Preconditions: MVP behavior and security gates passed; environment/traffic assumptions and operator ownership documented.
- Scope: representative load/performance checks, observability, abuse limits, backups/restore rehearsal, retention/deletion verification, CI/CD release and rollback controls.
- Non-goals: user-count-driven infrastructure rewrite, mandatory workers/NestJS/microfrontends or future product domains.
- Deliverables: measured capacity report, dashboards/runbooks, tested recovery artifact, threat/privacy review and release checklist.
- Acceptance: agreed SLOs/budgets measured with RLS enabled; secrets isolated; restore replay prevents deleted-user exposure; guest tool still works through provider outage.
- Tests: staged load and concurrency, production-like auth/session/cache checks, dependency/security review, accessibility/manual device pass, complete type/lint/build/unit/integration/E2E suite and restore drill.
- Dependencies: feature-complete MVP, chosen provider plan/region, deployment owner and staging.
- Risks: unreal workload assumptions, backup coverage gaps, browser variance and email/abuse costs.
- Recovery: previous deploy artifact, traffic rollback, writes paused and durable jobs retried; DB rollback through compatible schema rather than destructive down migrations.

## Phase 6: Future product/integration increments

- Preconditions: explicit approved product spec/ADR, measurable demand, mobile/host owner review and privacy/publication policy; do not infer authorization from this roadmap.
- Scope: one bounded context at a time: Community, Events, then explicit Battles publication/optional participant claims and future Expo identity client. Separate API/worker/routes only when metrics justify them.
- Non-goals: requiring accounts for all dancers, replacing LAN/SQLite/Host authority, silently uploading logs or extracting every module at once.
- Deliverables: versioned contracts and relational data for selected context, consent/roles, compatibility and failure-recovery design.
- Acceptance: domain boundary tests; cloud outages do not block mobile local battles; identity links optional and auditable; publication redacted and authorized.
- Tests: BDD domain/publication permissions, TDD use cases, provider/mobile HTTP contract tests, offline/LAN regression on mobile when later authorized, cross-client E2E and privacy tests.
- Dependencies: stable UUID/API identity, Events authorization before Battles cloud membership dependency, named domain owners.
- Risks: identity conflation, offline conflict semantics, publication consent and legacy local ID collisions.
- Recovery: disable integration/publication without losing local event logs; retain versioned mapping/publication history under reviewed retention policy.

## Ready-to-write Phase 1 task

Use only Phase 1 scope above. Inputs: accepted ADR file, extracted token/component tables, dependency graph/import rules, EN/RU route strategy and identified unknowns. Ask the implementation agent to read the new repo's rules, write/review the OpenSpec change and BDD acceptance first, then implement via TDD. Require exact compatible package versions, approved dependencies, type/lint/build/a11y/E2E gates and a final diff review. Explicitly forbid touching this Expo repository or provisioning production resources as part of repository scaffolding. Do not ask it to re-audit the mobile app.
