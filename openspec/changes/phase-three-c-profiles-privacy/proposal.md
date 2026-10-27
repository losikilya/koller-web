# Proposal

## Why

Completed 3C.1–3C.3 provide reviewed owner editing, mandatory completion, unindexed public presentation and optional bounded local avatars. Authorized Phase 3C.4 verifies their combined behavior and produces the final local integration handoff, preserving all historical evidence and accepted contracts.

## What Changes

- FR-401: verified active owner reads, explicit private DTO and lossless revision ETag.
- FR-402: normalized username/display name/bio updates through the existing owner RPC, duplicate/stale conflict feedback and reload-current semantics.
- FR-403: bounded same-origin HTTP with strict validation, safe errors, cookie propagation and no-store responses.
- FR-404: localized accessible My Profile and editing at `/en/account/profile` and `/ru/account/profile`, retained drafts and explicit reload/retry states.
- FR-405: preserve existing PostgreSQL ownership, independent revisions and concurrent username/edit arbitration, with real regression acceptance.

D-01–D-03 defaults and D-06 immediate old-handle reuse are accepted by the current implementation instruction: old names are immediately available, with a visible owner warning, no redirect history and stable UUID identity. This is one multi-stage change; 3C.1 was completed and is preserved as historical evidence. Revised 3C.2 is now authorized: explicit mandatory completion, always-public completed presentation and noindex public pages. The previous hide-toggle/indexable proposal is superseded, not historical implementation. The original 3C.2 increment deferred avatars; the current 3C.3 authorization below now permits a compatible direct decoder and reviewed additive local Storage migrations. 3C.4 remains deferred. No new backend, auth/provider redesign, social features, Git action or deployment.

## Capabilities

### New Capabilities

- `user-profile`: owner editing, explicit completion/gating and safe unindexed public profiles; optional local avatar handling is authorized below; combined future acceptance remains deferred.

### Modified Capabilities

None. Existing identity-foundation/user-auth/platform-shell/design-system contracts are preserved, including generic password-recovery feedback.

## Impact

New Profile module, owner route, GET `/api/v1/me`, PATCH `/api/v1/me/profile`, contracts and decimal-string Supabase wire typing; small app cookie adapter extraction; EN/RU profile messages and route link; mirrored tests, real database concurrency guard and browser BDD. Full original GREEN is captured before production edits. No archived evidence is rewritten.

## Revised Phase 3C.2 authorization (completed historical increment)

- FR-406: explicit atomic owner completion requiring unique username and nonblank displayName, with old records incomplete by default and completed required fields/public visibility protected in RPC/DB.
- FR-407: mandatory localized completion routing after login/callback and at document/RSC/data boundaries, preserving guest access and essential auth/recovery/logout/bootstrap.
- FR-408: safe SSR public username lookup, generic unavailable contract, locale/canonical continuity and unconditional noindex/nofollow/no-store.
- FR-409: accessible explicit public-onboarding UI with optional bio, consent notice, preserved drafts/revisions/uncertain-write reload and real browser acceptance.

The accepted route/API matrix, Unicode White_Space rule, additive local migration and history snapshots are defined in docs/web-platform/phase-3c/05-revised-completion-policy.md and ADR-0005. No bulk completion/publication, invented usernames, catalog/search, external configuration or archive. The following local avatar authorization prospectively refines the historical Storage deferral.

## Phase 3C.3 — Current local authorization

Completed 3C.1/3C.2 scope and reviews above are historical; the following authorization prospectively permits local avatars, a compatible direct decoder dependency and an additive local Storage migration. Only 3C.4 remains deferred. Preserve all historical bytes and UUID/completion/privacy/revision guarantees. No commit, push, amend, reset, deployment or external/production configuration.

- FR-410: exact shared 2 MiB boundary, bounded static image decoding and metadata-free bounded WebP output.
- FR-411: private local immutable Storage, owner-only revisioned/fingerprint-idempotent association and durable DB-backed attempt/pending limits.
- FR-412: controlled current-avatar delivery and optional safe DTO/SSR URLs, never paths/keys/signed URLs or shared caching.
- FR-413: accessible localized select/preview/upload/replace/remove, 2 MB/2 МБ hint, oversized error before network and preserved drafts/reload semantics.
- FR-414: authenticated local worker, 24-hour pending expiry, seven-day successful-deletion retention, durable retries and crash/late-orphan reconciliation.

Accepted D-07–D-10 local policy and architect constraints: docs/web-platform/phase-3c/06-avatar-local-policy.md and ADR 0006. Production hosting, keys and scheduler are undecided; manual local cleanup is not production readiness.

## Phase 3C.4 — Current local acceptance authorization

Authorized after the single Phase 3C.3 commit `524ef172acc8d327ba5591adfa76a8abefa80cba`. Earlier 3C.4 deferrals above describe their historical increments and are prospectively superseded only for this local acceptance. No new requirement or product behavior is proposed. FR-401–414 and all 17 existing mapped scenarios retain their original genuine evidence; the original 51 ledger events and report hashes are unchanged.

Verify combined optional avatar-before-completion, completion/revision continuity, rename/immediate reuse/public SSR and stale text editing after an actual avatar write. Add ordinary untagged browser acceptance linked to the existing requirements/scenarios, not invented RED or a retroactive TDD baseline. Fresh full GREEN, actual type reproduction, real SQL/Auth/Storage/cleanup and bundle isolation, final full verification and independent review support the handoff. Manual screen-reader limitations are reported explicitly.

Mandatory completion/always-public completed profiles supersede the original optional-publication/hide-toggle/indexable proposal. No privacy toggle, catalog/activity/social feature, new schema/dependency, production settings/scheduler, commit/push/amend/reset/deploy, automatic archive or Phase 4. A reproducible late defect requires a real regression before a minimal fix and reverification; a consequential contract/schema choice requires clarification.
