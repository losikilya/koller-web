# Phase 3B implementation plan

One OpenSpec change: phase-three-b-authentication. Scope is the supplied Phase 3B brief; no Phase 3C, commits, push or production deployment.

1. Inspect Phase 3A handoff, accepted ADRs, RLS, RPC, generated types, SSR cookies, proxy and UI/i18n; read-only architect consultation completed.
2. Record full preimplementation GREEN (baseline.log, exit 0) and local pgTAP/REST GREEN (database-baseline.log, exit 0).
3. Create requirements, executable BDD and loadable interfaces; record seven genuine assertion REDs. A test dependency loading failure was rejected by the TDD wrapper, not counted as RED.
4. Implement email registration/confirmation, password login, recovery/reset, Google PKCE, bootstrap retry, verified account and shell; record unchanged-test GREEN/REFACTOR.
5. Run real local Auth/Mailpit, RLS, browser EN/RU, accessibility, strict types, lint, formatting, coverage, builds, OpenSpec and full verify.
6. Obtain independent review, fix findings, record readiness. Archive only if all required gates pass.

No SQL migration is required: ensure_profile already derives auth.uid() and enforces private defaults. Main session is the only writer. Existing Phase 3A history and its exceptional acceptance are unchanged.
