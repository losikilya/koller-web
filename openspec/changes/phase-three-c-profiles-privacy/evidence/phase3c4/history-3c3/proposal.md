# Proposal

## Why

Completed 3C.1/3C.2 provide reviewed owner editing, mandatory completion and unindexed public presentation. Authorized local 3C.3 adds optional bounded avatars with private Storage and durable cleanup, preserving Identity, ownership, privacy and revision guarantees.

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
