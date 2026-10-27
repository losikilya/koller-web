# Phase 3C.3 — Accepted local avatar policy

Authorized 2026-10-27 after commit 0043dcecddf05ec9ae4f73d6bb47589cb496a377. D-07–D-10 are accepted for LOCAL implementation only. No commit/push/amend/deploy/reset, production configuration, 3C.4 or Phase 4. Preserve all original planning/implementation reports and evidence; the pre-3C3 manifest pins 170 historical tracked files and nine exact mutable-artifact snapshots.

## Image and UI contract

Contracts exports one `AVATAR_MAX_FILE_BYTES = 2 * 1024 * 1024`. Visible localized guidance says `2 MB` / `2 МБ`; selection above the exact boundary announces photo-too-large before any network upload. Current avatar/text drafts survive failure. Revoke abandoned preview URLs. Native file picker only, no drop/cropping studio. Avatar remains optional, including onboarding.

Static JPEG/PNG/WebP only, validated by signature, declared MIME and actual decoded format. Reject malformed/animated content, SVG/GIF, sides above 4096 or more than 16,000,000 pixels. Server sharp re-encoding strips metadata and emits WebP <=512x512 without enlargement and <=1 MiB. Bound decoder work/time. Multipart ceiling is file maximum plus 16 KiB; independently enforce file bytes after bounded parsing. Client hints/extension/Content-Length are not authority. Declare compatible direct sharp 0.35.5 via pnpm registry; no unrelated upgrades.

## Capabilities and HTTP

Private local `profile-avatars` bucket, immutable `owner-uuid/server-object-uuid.webp`, server-produced WebP only. Raw anon/authenticated SELECT/INSERT/UPDATE/DELETE denied. App infrastructure owns server-only decoder and narrow Storage/service RPC adapter. Module owns injected use cases/UI; shared module barrel never imports sharp or keys. Local launcher obtains supported local service key from CLI status and passes `LOCAL_AVATAR_SERVICE_KEY` only to local server runtime, never browser/Git/logs. Privileged adapter and worker independently require loopback provider URLs.

POST `/api/v1/me/avatar`: verified active owner, exact Origin, strong decimal-string If-Match, UUID X-Avatar-Operation and exactly one multipart file. DELETE uses the same identity/origin/revision/operation conditions. Preserve cookie refresh, stable safe errors, request IDs, no-store/noindex and explicit reload after uncertain writes. Avatar success updates current avatar/revision while retaining unsaved text drafts.

GET `/api/v1/profile-avatars/:id` serves only controlled bytes. Recheck current pointer, lifecycle/privacy/completion eligibility before and after Storage fetch; independently verified active owner may view an incomplete avatar. Stale IDs fail after replacement/removal. Never redirect to Storage, expose paths/keys/signed URLs or use Next image optimization/shared caches. Public SSR uses ordinary safe controlled URLs; noindex and completion rules remain. Already received/in-flight bytes cannot be recalled.

## Durable SQL protocol

Opaque profiles.avatar_id pointer plus private app_private ledger; avatar_path stays reserved. Pointer FK binds ID to owner; ledger survives Auth deletion. Existing four-column public readers keep signatures; a secondary restricted eligible-avatar-ID projection adds safe optional DTO URL.

Reserve/commit operation before decode/upload. UUID is bound to owner/kind/raw-content-and-MIME SHA-256; replay must match, costs no new attempt and never reattaches an old object. DB owner limits: five new avatar mutation attempts/minute, twenty/hour, three pending/ready uploads. Invalid processed attempts count; immediate durable abandonment frees pending slots. Keep rate timestamps independent of final state.

Service-only mark-ready follows immutable upload; caller-JWT revisioned attach/remove atomically changes pointer and queues the old object. Store attached_revision/idempotent outcome independently from object state. Cleanup/deleted is terminal: no mark-ready or attach resurrection. Retry a committed operation reads current state. Definite failed attachment compensates only unused new objects; uncertain commit requires reload.

Every mutating path locks **profiles -> ledger**. Worker reads candidates without held row locks, locks existing profile SKIP LOCKED then ledger SKIP LOCKED and rechecks state/pointer. No DB transaction spans Storage HTTP. Lease-token fencing protects ack/backoff; immediately before delete confirm token/current-pointer protection. Cleanup objects can never become current again.

## Cleanup and operational limits

Pending/ready TTL is **24 hours**. Authenticated local CLI supports bounded one-pass invocation and manual reruns after restart. Expire crashed work, retry with bounded backoff, reconcile dedicated-bucket storage.objects metadata including late objects and strictly generated orphan names. Only Storage API deletes bytes; no SQL object deletion or arbitrary caller paths. Missing/deleting owners are handled without cascading ledger loss.

Retain successful records **7 days after confirmed deletion**, pruning only when object and pointer are absent. Failed jobs never expire due to age. Requeue late objects before pruning and discover trusted generated orphans. Restart/lease/failure/TTL/retention/rate/concurrency behavior requires real local database and Storage acceptance.

Production hosting, scheduler, keys, monitoring and IP-level gateway protection are undecided/deferred. A local worker and owner DB limits do not claim production operations readiness. No public cleanup HTTP endpoint, Redis or global service.

## Architecture and verification

Read-only architect approved before Storage/migration implementation, requiring the lock order, fencing, fingerprint, terminal cleanup and double delivery checks above. NEW ADR 0006 extends Profile ownership without changing Identity. SC-426–431 use executable BDD and genuine RED/GREEN/REFACTOR. Root verify includes real Storage/database/worker tests. Preserve original 31 events; never call setup failure RED. Full final GREEN, independent review and scoped readiness precede handoff; change remains active.

Operation-id replay is guaranteed while its ledger record is retained, including seven days after successful cleanup. After pruning, a repeated client operation ID is a new operation and still needs a fresh current revision; its independently server-generated object UUID is always new, so an old image URL cannot revive. No indefinite tombstone retention is introduced. Remove attempts share the DB rate budget to bound empty-remove ledger growth.
