# Tasks

## 1. Baseline and tooling

- [ ] 1.1 Record full initial GREEN; preserve log and actual exit code.
- [x] 1.2 Install pinned Supabase and Zod dependencies with pnpm; document local commands and verify CLI availability.

## 2. Contracts and adapters

- [x] 2.1 Record SC-201–204 RED/GREEN/REFACTOR, implement strict contracts/config and verified initialization, and document boundaries.
- [x] 2.2 Verify request-scoped factories, cookie/cache propagation and existing localized routes through focused tests and full browser smoke checks.

## 3. Database

- [x] 3.1 Implement migrations, constraints, RLS, grants, initialization and public projections; document schema/security. SQL execution passed during recovery; historical TDD requirements remain under 3.2.
- [ ] 3.2 Run SC-205 real SQL/REST RED/GREEN/REFACTOR and reset migrations; generate and verify database types from local schema.

Recovery completed local migration/reset, 70 pgTAP checks, distinct-user REST security/concurrency/deletion acceptance and schema type generation. Original SC-205 RED/GREEN/REFACTOR and full initial GREEN remain absent. Tasks 1.1 and 3.2 intentionally keep unchecked boxes; the independently approved historical-exception.json now resolves exactly these gaps as accepted_by_approved_exception. Current acceptance PASS does not replace original proof.

## 4. Acceptance

- [x] 4.1 Run complete existing verify plus database tests and formatting of new docs; record exact outcomes in implementation-report.md.
- [x] 4.2 Obtain independent read-only review; resolve findings; workflow ready must pass before archive.

## 5. Owner-approved historical exception recovery

- [x] 5.1 Implement strictly scoped validator support with actual test-first RED/GREEN/REFACTOR and unchanged ordinary TDD tests.
- [x] 5.2 Capture fresh full verification, real local database acceptance and reproducible types; verify original/current evidence integrity.
- [x] 5.3 Obtain independent policy/implementation approval, record-backed historical resolutions and final PASS review; establish workflow readiness.

Tasks 1.1 and 3.2 retain unchecked historical status. Only a validated historical-exception.json may resolve them as accepted_by_approved_exception; this never means original GREEN or TDD completion. The owner authorized implementing this mechanism in evidence/exception/owner-authorization.txt. Archive still requires a separate final owner decision.

## Workflow follow-up

All current implementation/acceptance tasks pass; workflow ready returned true with the two explicit historical resolutions. Stop before archive and request the separate final owner decision.

- Archive natively only after all required verification and review gates pass.
- Do not commit, publish or start Phase 3B.
