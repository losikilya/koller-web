# Phase 3A implementation plan

Implement only the database and identity foundation. Preserve Phase 2 routes, UI, Storybook and translations. Owning change: phase-three-a-identity-foundation.

1. Inspect Phase 0 contracts, accepted ADRs and actual workspace; obtain read-only architecture consultation.
2. Record unchanged-product full GREEN baseline. Add executable acceptance contracts and loadable stubs; planning gate precedes implementation.
3. Record behavioral RED for validation, configuration, verified bootstrap and import boundaries; implement and record GREEN/REFACTOR.
4. Add local Supabase config, ordered migrations, SQL constraints/grants/RLS and public projection. Add real pgTAP and distinct-JWT REST tests; unavailable services cannot count as RED or validation.
5. Add SSR cookie adapters, refresh composition and cache protection with focused checks; keep guest pages usable without configuration.
6. Run existing full verification and local database verification, regenerate schema types, obtain independent review, and run workflow ready. Archive only after all gates pass.

Architect consultation found ADR impact NONE. Main session is the only writer. No commit, deployment or Phase 3B.
