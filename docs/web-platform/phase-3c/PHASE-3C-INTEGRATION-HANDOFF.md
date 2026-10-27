# Phase 3C — Local integration handoff

Phase 3C.4 local technical acceptance is complete on top of committed local avatars, HEAD `524ef172acc8d327ba5591adfa76a8abefa80cba`. Final full verification exited 0 (99 tests with coverage, real SQL/Auth/Storage/races, 27 browser examples, seven Storybook/a11y checks); independent read-only review is PASS with no actionable findings. The authoritative results and limits are in [PHASE-3C4-ACCEPTANCE-REPORT.md](PHASE-3C4-ACCEPTANCE-REPORT.md).

## Delivered local contract

- Verified owner profile read/edit, normalized fields, immediate username reuse with warning, immutable UUID, lossless conditional revisions, retained drafts and explicit reload after uncertain writes.
- Explicit mandatory unique username/display-name completion, authenticated incomplete-route gates and essential Auth/guest exceptions. Completed profiles are public; incomplete profiles are not publicly readable. EN/RU SSR/current canonical URLs are noindex/nofollow/no-store. Original optional-publication/hide/indexing alternatives are superseded.
- Optional avatar selection/upload/replacement/removal with visible 2 MB/2 МБ hint, exact 2 MiB limit before network and authoritative bounded static-image processing. Private local Storage, controlled current-image access, independent operation/object IDs, durable cleanup, 24-hour pending expiry and seven-day confirmed-success retention.
- Combined real browser acceptance joins avatar-before-completion, revision continuity, rename/reuse/SSR, and stale text editing after another tab's avatar write. A discovered error-classification defect now preserves definite SQLSTATE 40001 conflicts as 412 while unknown failures remain uncertain.

Detailed historical results stay in the original [3C.1 report](PHASE-3C1-IMPLEMENTATION-REPORT.md), [revised 3C.2 report](PHASE-3C2-IMPLEMENTATION-REPORT.md), and [3C.3 report](PHASE-3C3-IMPLEMENTATION-REPORT.md). Their original bytes, manifests, 51 TDD reports and committed proofs are preserved; the new stage records fresh local integration evidence separately.

## Local operation

Use the existing local Supabase stack and `pnpm dev:local`. `pnpm avatars:cleanup` is a bounded authenticated manual pass; rerun after restart, due backoff or reported failure. `pnpm db:test:avatars` covers real Storage/SQL/worker behavior. `PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm verify` runs the full root gate including database/Auth/Storage/races, browser-asset private-material isolation and all browser suites. Generated types must match the actual local public schema after formatting. No database reset is needed or authorized.

## Limits and next decision

Local callback/Auth/Mailpit coverage does not certify live Google OAuth, external SMTP or remote CI. Production hosting, scheduler, credentials, operator ownership and monitoring remain undecided. Browser axe/keyboard/focus/reflow checks are automated; manual NVDA/spoken-announcement verification was not run, and no accessibility certification is claimed. Already received image bytes cannot be recalled.

The change remains active and unarchived, ready for a separate owner archive decision. `pnpm workflow ready phase-three-c-profiles-privacy` exited 0 with 17 scenarios and ready=true. Original 51 TDD reports/history and commit proofs remain unchanged, and the new current-source/evidence manifest records the fresh integrated acceptance. No further commit, push, deploy, automatic archive or Phase 4 is authorized by this handoff. Archive approval remains the owner's separate explicit decision.
