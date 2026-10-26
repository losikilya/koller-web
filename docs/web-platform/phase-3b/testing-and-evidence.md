# Testing and evidence

Current evidence lives in ci-reports/phase-3b and the owning OpenSpec change. Logs keep actual process exits; earlier failed attempts remain distinct from successful runs.

- Full preimplementation pnpm verify: baseline.log, exit 0. Existing 72 workflow tests, 40 Vitest assertions plus coverage, 17 application browser and 7 Storybook checks passed.
- Real original DB baseline: database-baseline.log, exit 0, 70 pgTAP plus signed-JWT REST/RLS checks.
- Seven new scenarios: original RED reports and GREEN/REFACTOR ledger under openspec/changes/phase-three-b-authentication/evidence. Rejected loader attempts did not enter the ledger. A later TypeScript-only removal of an unsupported RTL option preserves the exact role/name assertion semantics; original cycle bytes remain unchanged.
- Real local Auth/Mailpit integration: auth-integration-second.log, exit 0. Covers signUp without session/profile, unconfirmed login, captured confirmation, reused token, bootstrap/default privacy, another user isolation, recovery/update, old/new password, local logout and rejected refresh, invalid token and signed expired JWT using the required local CLI JWT secret. Provider fixture/admin access is test-only. Earlier first run exposed missing service-role table SELECT grants; the test now checks preverification absence via local SQL without weakening grants.
- Browser BDD runs real signup and recovery in both locales; no admin-generated confirmation link is substituted for sent email. It verifies protected return, header, refresh, logout, reuse and accessibility. Security browser tests cover denial/invalid callback and CSRF. Separate Storybook checks retain existing WCAG tags and keyboard/reflow coverage.

Run pnpm db:start, pnpm test:auth, pnpm db:test, pnpm verify. Full verify now obtains local-only configuration, runs prior gates plus real DB/Auth acceptance and localized browser journeys. CI starts/stops a disposable local stack without hosted secrets. pnpm test:auth:e2e requires a production build made with the same local configuration; pnpm verify handles that sequence. No hidden skips, blind retries or continue-on-error are used. Fixtures use unique addresses and clean their own users/mail.

Final full-gate and independent-review outcomes are recorded in implementation-report.md after execution. Live Google/real SMTP delivery remain unverified and are not implied by local GREEN.

Full verify passed (exit 0): 54 unit assertions, two real Auth integration tests, 70 pgTAP plus REST/RLS, 21 app browser and 7 Storybook checks. Original bytes and digests are preserved in evidence/acceptance. Auth BDD has a separate project with traces/video/screenshots disabled to avoid retaining bearer cookies or email secrets; existing guest/Storybook diagnostics remain enabled. All 21 original TDD wrapper events contain captured Git HEAD/diff metadata; none was reconstructed. The original report/test hashes and bytes remain intact.

After independent review fixes, final full verify passed again: 72 workflow, 55 unit, two real Auth, 70 pgTAP plus REST/RLS, 21 application browser and 7 Storybook checks. The original six-file manifest remains unchanged; review-fixes.txt has its own separate digest manifest. There are eight TDD cycles and 24 preserved events. Final read-only review pass 2 returned PASS, all findings resolved; workflow ready returned true.
