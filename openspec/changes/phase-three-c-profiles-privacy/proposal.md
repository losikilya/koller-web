# Proposal

## Why

Phase 3C.1 delivered safe owner editing. Revised Phase 3C.2 now requires explicit completion before authenticated application access and exposes only completed public presentation through unindexed localized SSR pages, preserving the existing Identity and ownership boundaries.

## What Changes

- FR-401: verified active owner reads, explicit private DTO and lossless revision ETag.
- FR-402: normalized username/display name/bio updates through the existing owner RPC, duplicate/stale conflict feedback and reload-current semantics.
- FR-403: bounded same-origin HTTP with strict validation, safe errors, cookie propagation and no-store responses.
- FR-404: localized accessible My Profile and editing at `/en/account/profile` and `/ru/account/profile`, retained drafts and explicit reload/retry states.
- FR-405: preserve existing PostgreSQL ownership, independent revisions and concurrent username/edit arbitration, with real regression acceptance.

D-01–D-03 defaults and D-06 immediate old-handle reuse are accepted by the current implementation instruction: old names are immediately available, with a visible owner warning, no redirect history and stable UUID identity. This is one multi-stage change; 3C.1 was completed and is preserved as historical evidence. Revised 3C.2 is now authorized: explicit mandatory completion, always-public completed presentation and noindex public pages. The previous hide-toggle/indexable proposal is superseded, not historical implementation. 3C.3 avatars/Storage and 3C.4 combined acceptance remain deferred. No new backend, dependencies, auth/provider redesign, social features, commit, push or deployment; only the reviewed additive local completion migration is authorized.

## Capabilities

### New Capabilities

- `user-profile`: owner editing, explicit completion/gating and safe unindexed public profiles; avatar/combined future stages remain deferred.

### Modified Capabilities

None. Existing identity-foundation/user-auth/platform-shell/design-system contracts are preserved, including generic password-recovery feedback.

## Impact

New Profile module, owner route, GET `/api/v1/me`, PATCH `/api/v1/me/profile`, contracts and decimal-string Supabase wire typing; small app cookie adapter extraction; EN/RU profile messages and route link; mirrored tests, real database concurrency guard and browser BDD. Full original GREEN is captured before production edits. No archived evidence is rewritten.

## Revised Phase 3C.2 authorization

- FR-406: explicit atomic owner completion requiring unique username and nonblank displayName, with old records incomplete by default and completed required fields/public visibility protected in RPC/DB.
- FR-407: mandatory localized completion routing after login/callback and at document/RSC/data boundaries, preserving guest access and essential auth/recovery/logout/bootstrap.
- FR-408: safe SSR public username lookup, generic unavailable contract, locale/canonical continuity and unconditional noindex/nofollow/no-store.
- FR-409: accessible explicit public-onboarding UI with optional bio, consent notice, preserved drafts/revisions/uncertain-write reload and real browser acceptance.

The accepted route/API matrix, Unicode White_Space rule, additive local migration and history snapshots are defined in docs/web-platform/phase-3c/05-revised-completion-policy.md and ADR-0005. No bulk completion/publication, invented usernames, Storage, catalog/search, external configuration or archive is authorized.
