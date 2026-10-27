# Phase 3C.3 — Local Avatar Management

Authorized scope: optional local avatars only, within active `phase-three-c-profiles-privacy`. Phase 3C.4, production hosting/scheduler/keys and later features remain deferred. No commit, push, amend, deployment or database reset is authorized or performed for this increment. Existing HEAD is `0043dcecddf05ec9ae4f73d6bb47589cb496a377`.

## Implementation and accepted policy

The shared exact file ceiling is `2 * 1024 * 1024` bytes. EN/RU guidance visibly says 2 MB / 2 МБ. Oversized selection produces focused accessible feedback before upload network access. The server independently bounds multipart bytes, checks declared MIME/signatures and actual decoding, rejects animation/malformed or unsupported input, enforces 4096-side and 16,000,000-pixel ceilings, strips metadata and emits WebP no larger than 512x512 and 1 MiB. A compatible direct sharp 0.35.5 dependency matches the existing runtime family.

`modules/profile` owns injected avatar use cases and native accessible editor controls; app infrastructure owns server-only processing, verified HTTP and the privileged loopback-only Storage adapter. Contracts export the shared limits and controlled URL schema. Optional avatars never block mandatory profile completion. Public SSR retains completed/public gates, noindex/no-store and whitelisted DTOs. Owner preview permits incomplete profiles. Image delivery rechecks current reference and eligibility before and after fetching bytes, with no raw paths/signed URLs, optimizer or shared cache.

The private bucket denies ordinary anonymous/authenticated raw reads and writes. Caller-JWT reserve/attach/remove RPCs derive ownership, use lossless revisions and profile-before-ledger locks. Reservation precedes processing, enforcing five attempts/minute, twenty/hour and three pending uploads. UUID operation/fingerprint replay is separate from server-generated object UUIDs; even operation-ID reuse after retention cannot revive old image URLs. Replay guarantees last while operation records are retained; no indefinite tombstone claim is made.

Durable cleanup survives Auth deletion and process restart. Pending uploads expire after **24 hours**. Successful records remain **seven days after confirmed byte deletion**; failed work remains until resolved. Lease fencing, terminal object states, pointer protection and reconciliation cover stale acknowledgments, late objects and generated orphans. The bounded authenticated local worker deletes through Storage API only; it reports counts and returns failure status for unresolved jobs. This is a manual local operations facility, not a production scheduler.

Avatar success preserves unsaved text and advances its conditional revision. Uncertain writes lock both editors until explicit reload. If the post-write current read observes another device's text changes, the editor retains the draft but requires explicit conflict reload rather than silently rebasing an overwrite. Preview URLs are revoked and duplicate/aborted UI operations are guarded.

Policy: [06-avatar-local-policy.md](06-avatar-local-policy.md). Architecture: [ADR 0006](../../adr/0006-local-profile-avatars.md). Identity ownership is unchanged. Read-only architect approval and constraints were obtained before local Storage/SQL application; execution belongs to the main session.

## Local database and environment

Only local `storage.enabled` was enabled. The existing project was stopped and restarted with volumes preserved; no reset or production configuration was used. Migrations `20261027000002_profile_avatars.sql` and `20261027000003_avatar_cleanup_confirmation.sql` were applied locally without rewriting applied history. The latter corrects acknowledgment semantics: bookkeeping a failed retry must not claim confirmed deletion. Generated public database types were reproduced from the actual local schema and matched after formatting.

Local launchers obtain supported CLI credentials in memory and pass the private service key only to server execution. CLI status/start output containing keys is not stored in evidence. The adapter and worker independently reject non-loopback provider URLs; built browser assets are checked for the actual private key and private variable name.

## Evidence and verification status

Evidence home: `openspec/changes/phase-three-c-profiles-privacy/evidence/phase3c3`. Full preimplementation `baseline.txt` passed before source/Storage changes. SC-426–431 have genuine behavioral RED/GREEN/REFACTOR records, events 032–051; original historical 31 events and prior reports/manifests are preserved. The cleanup test fixture was corrected before its implementation to distinguish operation/object IDs and acknowledgment success, with new genuine RED records and an explanation; no setup error is counted as RED. Final formatting after completed cycles is verified against current tests separately, without rewriting historical hashes.

Original failed attempts remain: local cache access and dependency-store setup failures; Playwright's CJS loader/route-announcer fixture corrections; the real empty DELETE transport regression; initial real SQL fixture constraints and the confirmed cleanup acknowledgment regression. Ordinary unchanged RED/GREEN tests cover the empty-body fix. MSW download-path correction follows the installed SDK's actual transport; assertions were preserved. The post-avatar text conflict regression first failed on an enabled save; a later selector typo (`Cancel` versus existing `Cancel edits`) was corrected without weakening the conflict assertion. Focused current checks pass seven tests in three files. Initial lint import ordering was fixed, not suppressed.

Real acceptance exercises private Storage denial, actual processed bytes, attach/remove and attach/attach races, replay, limits, 24-hour expiry, lease fencing, failed-job durability, retention/pruning, late objects, worker concurrency/restart and large revisions. Real EN/RU browser acceptance covers exact 2 MiB upload, oversize-before-network/focus, malformed bypass, replacement/removal/stale URLs, no-JavaScript SSR, metadata stripping, uncertainty/reload, keyboard and automated accessibility/reflow. Historical focused passes are evidence, not a replacement for final verification.

Final full `PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm verify` exited **0**, after the last production/test corrections. Actual log: `evidence/phase3c3/verify-final-second.txt`; SHA-256 `ec3a0553576da02128b0f506560f71b7d04dbe0d69fd49f0a5edd99fa812895c`. The first full attempt stopped on test-only TypeScript errors (unsupported RTL role-query option and generic typed-array BodyInit); supported default exact role matching and an owned ArrayBuffer corrected the fixtures without weakening assertions. An intervening sandbox SWC cache failure is retained separately and is not product RED.

The successful complete gate includes:

- Agent consistency, 72 workflow checks, lint/boundaries, strict types and formatting.
- 95 tests in 38 files and all 95 again under coverage.
- 74 real pgTAP checks and signed-JWT REST/RLS acceptance; real owner/completion/public-read concurrency tests.
- Expanded actual Storage/SQL/worker acceptance, including two concurrent attach attempts and disjoint worker claims; two Auth/Mailpit tests.
- Next and Storybook builds; private credential/configuration absent from all 17 built browser assets.
- 24 application browser scenarios in Edge, including actual EN/RU SC-431; seven Storybook interaction/accessibility scenarios; strict OpenSpec validation 6/6.

Independent read-only review pass 1: **PASS**, no actionable findings. The actual response is retained in `evidence/phase3c3/review-pass1.txt`; it directly covers source including untracked files, tests/RED causes, SQL, processing/capabilities, cleanup and editor coordination. The reviewer inspected final logs but ran no tests/scripts/network. Main-session integrity validation checked 170 historical files (nine current active artifacts use their exact pre-3C3 snapshots), the original 31-event ledger prefix and every one of 51 report hashes. The current-source pin covers 236 source/config/test files, with no source change during the final full run. Hashes are byte-integrity records, not signatures or remote CI proof. Prior acceptance manifests and committed byte proofs remain untouched.

`evidence/phase3c3/acceptance-manifest.json` binds current source, original history, actual final log/exit, current policy/planning, review and this report. No prior increment's PASS is reused. `pnpm workflow ready phase-three-c-profiles-privacy` exited **0**, reporting **17 scenarios, ready=true**, after all verified tasks were marked complete (`evidence/phase3c3/workflow-ready.txt`). This is scoped local increment readiness; it does not accept deferred 3C.4 or production work. Phase 3C.3 is complete locally, and the change remains active.

## Local operation and remaining scope

- `pnpm dev:local`: run against existing local Supabase with server capability.
- `pnpm avatars:cleanup`: process at most twenty due jobs; rerun manually after restart or reported failure/backoff. It reconciles dedicated-bucket metadata first.
- `pnpm db:test:avatars`: real local PostgreSQL/Storage/worker acceptance.
- `pnpm build:local` and `pnpm test:avatars:e2e`: local build and focused browser acceptance.
- `PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm verify`: complete unchanged gate plus additive avatar security/database/client-asset checks.

Production scheduling, monitoring/operator ownership, deployment credentials and gateway abuse controls need separate decisions. Already received/in-flight image bytes cannot be recalled. No account-deletion orchestration, catalog, activity, social functionality, Phase 3C.4 or Phase 4 is delivered. The OpenSpec change stays active and unarchived.
