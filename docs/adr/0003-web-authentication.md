# ADR-0003: Web authentication boundaries

Status: Accepted for Phase 3B, following read-only architect consultation.

Supersedes ADR-0002's deferral of auth UI/endpoints; preserves its module direction and Phase 3A identity foundation.

Identity owns auth use cases, normalized contracts and interactive forms via explicit public exports. Next app owns writable cookie/HTTP adapters, verification callbacks, protected routes and verified shell composition. Shell receives a minimal server-derived authenticated projection, without reading app internals or maintaining auth state. Shared Supabase owns the existing provider infrastructure. Contracts depend only on Zod. Email uses SSR token-hash verification for cross-device links; Google uses provider PKCE. No SQL schema change, second auth framework, custom account merging or profile editing is introduced.

Consequence: auth pages and shell use dynamic server verification, and full acceptance requires the disposable local Auth stack/Mailpit in CI. External Google verification stays explicitly separate from local acceptance.
