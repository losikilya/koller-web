# Proposal

## Why

Phase 2 has no database or identity infrastructure. Phase 3A establishes private account storage and verified SSR capabilities before authentication UI is introduced.

## What Changes

- FR-201: Strict framework-independent profile, privacy, preferences and bounded JSON contracts.
- FR-202: Validated public Supabase configuration; reject privileged keys and insecure remote URLs.
- FR-203: Cookie-based request-scoped SSR, refresh composition and verified profile bootstrap.
- FR-204: Preserve framework boundaries while permitting exactly Zod in contracts.
- FR-205: Versioned four-table schema, atomic bootstrap, owner RPCs and restricted public reads, proven against local PostgreSQL and distinct REST credentials.

No login UI, OAuth setup, timer logic, production project, deployment, Events/Battles or Phase 3B.

## Capabilities

### New Capabilities

- `identity-foundation`: private account persistence and safe infrastructure contracts.

### Modified Capabilities

None. Existing public routes, localization and design system remain unchanged.

## Impact

Supabase CLI/SDK/SSR, Zod, contracts, app framework adapters, identity module, proxy, local SQL and tests. Retain pnpm lockfile and existing gates. Database execution is an acceptance prerequisite; unavailable Docker must be reported, never replaced with mock RLS proof.
