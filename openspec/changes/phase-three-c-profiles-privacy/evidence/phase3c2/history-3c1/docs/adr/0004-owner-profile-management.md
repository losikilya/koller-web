# ADR-0004: Owner Profile management boundaries

Status: Accepted for the authorized Phase 3C.1 increment, after read-only architect consultation.

## Context

Phase 3A SQL and Phase 3B verified bootstrap already own persistence and identity. Owners need presentation editing without moving those responsibilities or exposing private storage/provider data.

## Decision

Profile owns presentation contracts, focused owner read/save use cases, a caller-scoped Supabase adapter and client editor through named public exports. App owns verified principal composition, Next cookies/HTTP/conditional headers and the separate localized account/profile route. Bootstrap remains Identity-owned; no cross-module private imports or additional auth state store.

Read PostgreSQL revisions as decimal strings using explicit PostgREST text casts. Preserve them as strings through contracts, strong ETags and existing RPC bigint arguments; generated database output is untouched and the existing SDK typing seam models decimal-string wire input. Profile and privacy revisions remain independent. Write returns reload-current state, without promising an atomic original-commit snapshot. Uncertain outcomes require explicit reload.

D-01–D-03 recommended defaults and D-06 immediate handle reuse were accepted by the implementation instruction on 2026-10-27. UI warns that old handles become available immediately; immutable UUID ownership and existing raw SQL normalization/validation rules stay intact. No reservation/history service is introduced.

## Consequences

No schema migration, provider redesign, dependency or framework extraction is needed. Service/core code imports no Next/browser/provider runtime; the adapter has no server-only runtime in the mixed public barrel, and the client editor imports only contracts/local dependencies. HTTP adapter extraction remains app-owned and preserves Auth cookie/error handling. Public pages, privacy mutation UI and Storage remain deferred; this ADR does not approve their capabilities. No accepted ADR is superseded.
