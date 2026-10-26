# Proposal

## Why

Phase 3A supplies verified identity and private profile storage, while visitors still see authentication placeholders. Phase 3B connects Supabase Auth to accessible localized application flows.

## What Changes

- FR-301: email/password registration, confirmation pending and single-use SSR email verification.
- FR-302: verified login, protected account, safe localized return and local logout.
- FR-303: generic recovery request and verified password reset.
- FR-304: Google PKCE start/callback and safe cancellation/failure.
- FR-305: idempotent private profile bootstrap with recoverable retry, without destroying authentication.
- FR-306: EN/RU accessible forms, session-aware navigation and guest access.
- FR-001: replace identity placeholders with real authentication; preserve the guest Timer preview.

## Capabilities

### New Capabilities

- `user-auth`: registration, confirmation, login, recovery, Google OAuth and verified account shell.

### Modified Capabilities

- `platform-shell`: FR-001 identity routes offer real authentication while Playground remains public.

## Impact

Existing contracts, identity module, Next route adapters, shell, i18n, local Supabase email templates, browser/integration tests and CI. Preserve SSR refresh, RLS, SQL grants and dependency versions. Security includes same-origin mutations, provider PKCE, explicit return allowlist, no-store responses and safe errors. No Phase 3C, profile editing, uploads, merging, timer functionality, production configuration, commit, push or deployment. Live Google verification is separate and may remain explicitly unverified without credentials.
