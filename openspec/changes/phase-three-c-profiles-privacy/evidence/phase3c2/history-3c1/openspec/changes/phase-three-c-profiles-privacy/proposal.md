# Proposal

## Why

Verified users currently see only bootstrap status on their account page. Phase 3C.1 makes their existing private profile readable and editable without changing Identity, SQL ownership or privacy rules.

## What Changes

- FR-401: verified active owner reads, explicit private DTO and lossless revision ETag.
- FR-402: normalized username/display name/bio updates through the existing owner RPC, duplicate/stale conflict feedback and reload-current semantics.
- FR-403: bounded same-origin HTTP with strict validation, safe errors, cookie propagation and no-store responses.
- FR-404: localized accessible My Profile and editing at `/en/account/profile` and `/ru/account/profile`, retained drafts and explicit reload/retry states.
- FR-405: preserve existing PostgreSQL ownership, independent revisions and concurrent username/edit arbitration, with real regression acceptance.

D-01–D-03 defaults and D-06 immediate old-handle reuse are accepted by the current implementation instruction: old names are immediately available, with a visible owner warning, no redirect history and stable UUID identity. This is one multi-stage change; only 3C.1 is authorized now. 3C.2 privacy/public pages, 3C.3 avatars/Storage and 3C.4 combined acceptance remain deferred. No new backend, dependencies, migration, auth/provider redesign, social features, commit, push or deployment.

## Capabilities

### New Capabilities

- `user-profile`: owner profile access and editing, with future Profile stages retained as explicitly deferred work.

### Modified Capabilities

None. Existing identity-foundation/user-auth/platform-shell/design-system contracts are preserved, including generic password-recovery feedback.

## Impact

New Profile module, owner route, GET `/api/v1/me`, PATCH `/api/v1/me/profile`, contracts and decimal-string Supabase wire typing; small app cookie adapter extraction; EN/RU profile messages and route link; mirrored tests, real database concurrency guard and browser BDD. Full original GREEN is captured before production edits. No archived evidence is rewritten.
