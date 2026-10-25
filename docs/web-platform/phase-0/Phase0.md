# Phase 0 Handoff

## 1. Executive summary

Phase 0 provides a grounded architectural foundation for a separate Hybrid Dance Platform. MVP: Identity, privacy-controlled Profile and guest-first Playground with Practice Timer. Community, Events, Battles and educational/commercial products remain future work. This checkout remains an independent offline-first mobile application. See [00](00-executive-summary.md).

## 2. Verified repository architecture

Expo ~54.0.36, React 19.1.0, RN 0.81.5, TypeScript ~5.9.2, Zustand ^5.0.13, Expo Router ~6.0.24, npm lockfile v3 (`package.json`, `package-lock.json`, `tsconfig.json`). Host store serializes commands, persists successful events in SQLite, then applies/publishes state and restores via replay (`src/stores/demoBattle/useDemoBattleStore.ts`, `src/infrastructure/storage/appEventRepository.ts`). Native LAN transport is newline-delimited JSON/TCP, not actual WebSockets (`src/stores/judgingServer/useJudgingServerStore.ts`). Web preview event storage is memory-only. Local roles/device/participant IDs are not global accounts. Full fact/source/behavior/applicability/risk and reuse inventory: [01](01-mobile-repository-audit.md).

## 3. Extracted design language

Near-black #0B0C0E, cyan #4cd6ff, violet #d05bff/#ecb1ff, white text; Hauora regular/bold/extra-bold; outline Ionicons; dark bordered rounded native surfaces and dance bitmap imagery. Sources: `src/constants/Colors.ts`, `src/components/Text/Text.tsx`, `src/components/Cards/Card.tsx`, `assets/fonts/`, `assets/hero.png`. Web proposal preserves colors/type intent with accessible cyan foreground, explicit semantic tokens, compact desktop surfaces, responsive layout and keyboard/focus. Rights/Cyrillic coverage unknown. Extracted versus proposed tokens/states: [02](02-design-system-extraction.md).

## 4. Proposed web architecture

Separate pnpm/Turborepo repo; Next.js/React/TypeScript, Supabase Auth/PostgreSQL, thin BFF, modular monolith. apps/web plus ui/design-tokens/contracts/shared-kernel/config packages. Controlled public interfaces and acyclic graph; SSR public routes, client timer. No initial NestJS, Module Federation or independent micro-app deployments. EN/RU locale routes, English default. See [03](03-platform-architecture.md).

## 5. Data model summary

Managed auth.users UUID -> profiles -> profile_privacy/user_preferences/playground_user_data. Presets have appId, record UUID, schema version, bounded validated JSONB, server revision/timestamps and atomic per-user quotas. Future events/memberships/sessions/participants/publications remain conceptual; local participants can optionally link to UserId through scoped mapping with consent, without requiring accounts. ERD/columns/SQL illustrations: [06](06-database-and-privacy.md).

## 6. Authentication and privacy design

Provider email/password verification/recovery and Google PKCE; verified SSR cookie/bearer principals, safe callbacks, generic auth errors and isolated secrets. Profiles default private/not discoverable. Owner-only base tables; controlled exact public reads versus discoverable listing; private/missing indistinguishable, privacy-aware file access and no shared personal caching. Account deletion hides first and retries storage/provider cleanup with cascades/tombstone restore. See [05](05-identity-and-auth.md), [06](06-database-and-privacy.md), [07](07-api-and-contracts.md).

## 7. Playground and Practice Timer design

Stable manifest/appId, lazy public route and narrow persistence/locale services; manifest is not authorization. Pure timer engine receives injected time; callbacks only sample elapsed schedule. Start/pause/resume/reset, round/work/rest/remaining projection, zero rest, no final rest, optional audio and accessible EN/RU controls. Guest local presets; authenticated conditional cloud writes; explicit import creates copies, never overwrites by name. Suspended-page fallback is documented; active session does not survive reload in proposed MVP. State machine, module layout, schemas, edge cases, unit/integration/BDD acceptance: [08](08-playground-architecture.md), [09](09-practice-timer-specification.md).

## 8. Accepted ADRs

ADR-001 Next framework; 002 separate pnpm/Turbo repo; 003 Supabase/thin BFF; 004 modular monolith; 005 UUID identity; 006 preserve offline mobile; 007 future route extraction; 008 optional independent API; 009 OpenSpec/BDD/TDD; 010 bounded versioned JSONB; 011 EN/RU; 012 server privacy/private defaults; 013 guest-first; 014 isolated Practice Timer. All remain Accepted. See [04](04-architecture-decision-records.md).

## 9. Recommended implementation sequence

1. Separate repository, tooling, OpenSpec, locale shell, design primitives and import boundaries.
2. Identity/profile/privacy and secure DB/auth lifecycle.
3. Isolated guest Playground/Timer and local presets (core may proceed independently of cloud auth).
4. Cloud presets, revisions, quotas and opt-in guest import.
5. Release/security/accessibility/load/recovery verification and measured operations.
6. Explicit future domain/mobile integration increments when approved.

Every phase has preconditions, scope/non-goals, deliverables, acceptance, tests, dependencies, risks and recovery in [11](11-implementation-roadmap.md). No Phase 1 work started.

## 10. Risks and unresolved decisions

Known source limitations: non-UUID local IDs, nondeterministic clock/ID reads in some domain helpers, memory-only web event preview, no configured test/lint/typecheck scripts, no full i18n engine, static mobile dimensions. Unknowns: runtime native reliability, installed versions, asset rights/Cyrillic, deployment/provider compatibility, region/budget, legal retention and real load. Timer/default/limit/import implementation refinements are explicitly proposed. No OpenSpec setup found; graph tooling described by CLAUDE is unavailable. See [12](12-risks-and-open-questions.md).

## 11. Created documentation files

[00-executive-summary.md](00-executive-summary.md), [01-mobile-repository-audit.md](01-mobile-repository-audit.md), [02-design-system-extraction.md](02-design-system-extraction.md), [03-platform-architecture.md](03-platform-architecture.md), [04-architecture-decision-records.md](04-architecture-decision-records.md), [05-identity-and-auth.md](05-identity-and-auth.md), [06-database-and-privacy.md](06-database-and-privacy.md), [07-api-and-contracts.md](07-api-and-contracts.md), [08-playground-architecture.md](08-playground-architecture.md), [09-practice-timer-specification.md](09-practice-timer-specification.md), [10-scalability-and-operations.md](10-scalability-and-operations.md), [11-implementation-roadmap.md](11-implementation-roadmap.md), [12-risks-and-open-questions.md](12-risks-and-open-questions.md), [13-phase-0-acceptance-report.md](13-phase-0-acceptance-report.md), and this Phase0.md. All under docs/web-platform; no root handoff file because of the explicit write boundary.

## 12. Validation results

Static repository facts cross-checked against actual source, accepted ADRs reviewed, and schema/auth/API/privacy/timer assumptions aligned. Validation passed: fifteen required files, 43 relative Markdown links, 174 explicit repository path references, fourteen ADR IDs, balanced fences and no trailing whitespace; five Mermaid diagrams present. Git diff --check passed; tracked diff is empty; git status lists only fifteen new documentation files. No application runtime tests/build/start, database migrations or rendered Mermaid checks were run; production behavior is not certified. Detailed gates/limitations: [13](13-phase-0-acceptance-report.md).

## 13. Application unchanged

Baseline working tree was clean. Phase 0 changes are new Markdown documentation only under docs/web-platform. No source code, dependencies, lockfiles, build scripts, app/environment/agent configuration, cloud resources, SQL files or commits were changed/created. No reset/revert of user work. Existing mobile architecture remains independent; Phase 0 stops here.
