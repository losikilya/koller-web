# Phase 3B implementation report

Status: **Phase 3B complete and natively archived**. Final independent review PASS; workflow ready: true; full local verification passed.

Delivered: shared Zod auth contracts; provider-backed registration, token-hash email confirmation, password login/recovery/reset, Google PKCE start/callback, local logout; writable SSR cookie propagation; same-origin mutations; exact locale-aware return allowlist; verified minimal account and private bootstrap retry; EN/RU accessible forms and auth-aware server shell. Phase 3A SSR, RPC, SQL grants and RLS remain unchanged. No new database migration.

Tests: full original baseline and real database baseline passed. Seven RED/GREEN/REFACTOR scenarios are recorded. Real Auth/Mailpit integration passed. Complete browser acceptance and full verification have now passed; independent review follows below.

Live Google provider login and external SMTP delivery are unverified. No live credentials were supplied. The complete implementation supports future manual provider setup; controlled callback behavior is tested independently.

No commit, push, production deployment or Phase 3C work is authorized or performed.

## Complete local acceptance

- Full original GREEN baseline: exit 0; raw baseline.txt in change evidence. Real DB baseline: 70 pgTAP plus signed-JWT REST/RLS, exit 0.
- Frozen offline lockfile install: exit 0. No dependency version was upgraded; existing next-intl and Supabase SDK versions are declared for root test consumers.
- Full final pnpm verify: exit 0, ci-reports/phase-3b/verify-fifth.log and exact copied evidence/acceptance/verify.txt. Agents, 72 workflow tests, lint/boundaries, strict types, formatting, 54 unit assertions plus coverage, 70 pgTAP plus real REST/RLS, two real Auth/Mailpit integration tests, Next/Storybook builds, 21 application browser checks, 7 Storybook/WCAG checks and strict OpenSpec 5/5 passed.
- Real email expiry is tested by changing only a disposable fixture's local confirmation timestamp. Callback cookies/error headers, duplicate submission/abort and actual SDK PKCE challenge/verifier generation have additional focused guards.
- Client output scan: 15 JavaScript files, zero exact matches for local privileged keys/JWT secret. No real credentials are committed.
- Full failed attempts are preserved in ci-reports/phase-3b/verify-first through verify-fourth.log: test lint/type/setup/catalog issues were corrected without reducing gates. browser-first.log retains initial selector failures involving the skip-link fragment and Next route announcer. They are not TDD RED evidence.
- Seven original TDD cycles remain byte-preserved. All 21 original wrapper events contain captured Git HEAD/diff hashes and exact test/report hashes. The initial non-elevated inspection encountered Git ownership restrictions; elevated TDD subprocesses captured Git metadata successfully. A later RTL type-only option correction preserves assertion semantics.
- Current route-catalog regression adds the explicitly specified forgot/reset/account routes; the original archived test evidence is untouched.

Raw acceptance outputs and SHA-256 references are in the owning change's evidence/acceptance/manifest.json. Google live-provider consent/login, external SMTP delivery and an actual remote GitHub Actions run are unverified here. Local Windows/Edge acceptance and CI wiring do not imply those external checks ran.

## Independent review corrections

Pass 1 returned PASS with no BLOCKER/HIGH, plus one MEDIUM and two LOW findings. Google start now requires the server-only AUTH_GOOGLE_ENABLED=true opt-in after real provider configuration; otherwise it returns a localized unavailable state without navigating outside the application. SC-308 recorded a genuine assertion RED, then unchanged-test GREEN/REFACTOR. Login/register no longer duplicate the brand in metadata. Both baseline and then-final workflow counts are corrected to the actual 72 in their raw logs. The initial Git-provenance reporting error was corrected against the original populated ledger; no evidence was reconstructed or edited. Final full acceptance and second review follow after execution.

After review fixes, complete pnpm verify passed again, exit 0 (ci-reports/phase-3b/verify-review-fixes.log; exact evidence/acceptance/review-fixes.txt plus its separate digest manifest). Current results: 72 workflow tests, 55 unit assertions plus coverage, 70 pgTAP and real REST/RLS, two actual Auth/Mailpit tests, 21 app browser and 7 Storybook checks, both builds, lint/types/format/agents and strict OpenSpec 5/5. The browser security checks now verify localized disabled-Google feedback in both locales. Eight genuine TDD cycles (24 events) are preserved. Independent review pass 2 is pending.

## Final independent acceptance

Independent read-only review pass 2/2: PASS, all findings resolved, no new actionable findings. Actual response is preserved in the change evidence/review-pass2.md. Main-session full verification and reviewer inspection remain distinct. pnpm workflow ready phase-three-b-authentication exited 0 with ready: true and eight mapped scenarios; raw ready.txt is preserved. All deliverables and tracked implementation/acceptance tasks are complete.

## Native archival result

The native pnpm spec archive phase-three-b-authentication --yes --json command exited 0, with validation and specification synchronization enabled: six user-auth requirements added, platform-shell FR-001 modified, zero removed or renamed. Archive: [2026-10-26-phase-three-b-authentication](../../../openspec/changes/archive/2026-10-26-phase-three-b-authentication/). Actual [final independent response](../../../openspec/changes/archive/2026-10-26-phase-three-b-authentication/evidence/review-pass2.md) remains preserved. No archived content was edited after moving.

Postarchive validation confirmed all 24 original TDD report hashes and all seven raw acceptance log hashes/sizes match their previously recorded values. Prior tracked archives, Phase 3A documentation and SQL migrations are unchanged. The optional complete pre-move file inventory failed due to an inventory-script error; no whole-archive before/after byte comparison is claimed or reconstructed. Existing report/manifests provided the independent integrity comparison. Active source is absent, stable user-auth blocks match the delta, shell FR-001/SC-001 are synchronized, archived-directory workflow validation returned ready: true, and strict OpenSpec passed 5/5.

The CLI-generated new stable user-auth spec required standard formatting only; format-postarchive.log preserves the initial failure. Prettier is applied only to that new stable specification and this current report, followed by final format/spec/agent validation. This does not alter archived evidence or product behavior. No commit, push, deployment, account-management UI or Phase 3C was performed.
