# Design

## Context

See proposal.md, the Phase 3C.0 audit and the accepted revised 3C.2 policy. Phase 3C.1 used existing SQL and its original full GREEN is preserved in evidence/baseline.txt. Revised 3C.2 has a separate fresh GREEN, explicit completion state and one reviewed additive local migration; no new dependency is needed.

## Goals / Non-Goals

Goals: minimal Profile extension, mandatory completion, lossless caller-JWT writes and safe unindexed public SSR. Non-goals: user hide toggle, avatar/Storage, activity/catalog/search, auth redesign, history redirects and reservation infrastructure.

## Phase 3C.1 decisions — historical foundation

D-01–D-03 recommended defaults and D-06 immediate reuse accepted by the current explicit implementation instruction (2026-10-27). Keep original planning findings as history; append accepted-decision record. `/account` retains Identity bootstrap; `/account/profile` owns Profile UI. App verifies principal and composes a narrow service/adapter. Client editor imports contracts/local files, never its own barrel. Adapter has no runtime server-only dependency in the mixed public barrel. Existing cookie response context is extracted inside app infrastructure, preserving Auth behavior.

Owner SELECT uses explicit columns, deletion guard and `revision::text`; privacy has its own decimal revision. Shared Supabase wire typing override models bigint RPC decimal-string input; the generated file stayed unchanged in 3C.1 and is regenerated from actual local schema for the 3C.2 migration. Validate canonical positive decimal ≤ signed bigint max; never convert to Number. ETag is a quoted opaque `profile-<revision>`. Missing records trigger safe bootstrap-incomplete/retry via existing account recovery. No owner ID/path in mutation input.

Use normalized form patch schema separate from canonical existing SQL schema. Post-write read gives reload-current semantics; if a newer state differs, UI explains it. If write succeeded but reload failed, expose outcome_unknown and require explicit reload; never automatically replay. Conflict keeps draft/base ETag until explicit reload. Save failure never changes inputs. Busy editor disables all controls; abort on unmount. No persistent cache/auth store. All transport replies have no-store; metadata noindex. Exact configured Origin protects PATCH. Stream body bytes with a strict limit before JSON parse. HTTP uses safe errors and ETags, not SQL messages.

## Risks / Trade-offs

Handle conflict still reveals unavailability; no bulk availability endpoint. Immediate reuse can reassign old links, so warn before edits and add no old-name redirects. Revisioned writes are separate from post-write reads; explain refreshed differing state. Independent privacy revision does not publish a reviewed profile snapshot. No release/deployment abuse-control or Storage certification is implied.

## Architecture consultation and migration

Read-only architect found no blocker and recommended a NEW Profile ownership ADR without superseding accepted principles. Installed PostgREST parser supports casts and preserves RPC arguments; real tests must prove decimal-string acceptance. No migration, generated-type rewrite or dependency is needed. Existing recovery FR-303 remains regression protected. The change remains active; later stages require separate authorization/planning updates and are not part of this increment's readiness claim.

## Revised Phase 3C.2 design (supersedes earlier deferral)

Follow ADR-0005 and the revised policy/matrix. Nullable completed_at is explicit, with no backfill or bulk visibility rewrite; public functions require it. complete_own_profile locks profiles then privacy, validates canonical required fields and both independent expected revisions, marks completion/public with discovery false atomically. Existing update/privacy/domain-data RPC paths enforce completed required fields, no hide/premature publication and completion gating; lock_owner itself remains bootstrap-compatible. Required displayName uses explicit Unicode White_Space nonblank parity in SQL/contracts, retaining existing ASCII normalization/limits.

App composition owns fail-closed completion routing and safe auth returns. Shared refresh callback becomes async/verified-context capable without domain imports. Route adapters independently guard before data; essential auth/reset/logout/account retry/completion and assets stay usable. Unknown paths remain 404. Public SSR uses the restricted username projection only, same whitelist as UUID/list; all profile HTML/RSC/metadata/errors are no-store/noindex/nofollow, no indexing signal. Completion marker/private rows never enter public DTOs. Dynamic validated username paths preserve locale; canonical uses current handle with no old-name history.

Original 3C.0/3C.1 documents/current artifacts/source snapshots are retained under evidence/phase3c2/history-3c1 and pinned by history-manifest.json; old ledger events/reports/logs are unchanged. New scenario IDs append to the existing workflow. Previous optional-publication fixtures are revised prospectively, preserving their original bytes in history. Only the reviewed additive LOCAL migration is applied without reset, followed by actual type generation, focused real SQL and full verify. No later-stage scope is pulled in.

## Authorized Phase 3C.3 architecture

Apply the accepted local policy and ADR 0006. App owns server-only sharp/Storage/HTTP adapters; Profile owns injected use cases and UI; contracts exports the exact file limit. Use opaque owner-bound pointer and private durable operations with fingerprint-bound idempotency, independent decimal revisions, terminal cleanup and profiles-before-ledger locks. Worker uses narrow authenticated service RPCs, leases and Storage API deletion; reconcile late/orphan metadata and recheck current pointer before deletion. Controlled image delivery checks authorization twice, and existing four-column public readers keep signatures. No production settings or Git action.

Original active artifacts are snapshotted in evidence/phase3c3/history-3c2. History manifest pins 170 preexisting tracked planning/report/evidence files; original 31 TDD events remain a preserved prefix. Real full preimplementation GREEN is evidence/phase3c3/baseline.txt. New behavior requires real assertion RED before implementation, never a missing loader/Storage setup error. Real local Storage/DB/worker acceptance extends root verify.

## Phase 3C.4 integrated acceptance

No architecture/ADR, schema, dependency or observable-contract change is planned. Preserve ADR-0004/0005/0006. Prospective task/evidence updates have exact pre-3C4 snapshots in evidence/phase3c4/history-3c3. History pins 272 tracked files, nine snapshots and eleven original commit-proof files. The one previous commit authorization is consumed; no further Git mutation or automatic archive is part of this stage.

Acceptance joins actual local browser, HTTP, caller-JWT SQL and private Storage boundaries through new ordinary existing-behavior journeys. Reuse current fixture capabilities and real root orchestration; do not replace existing SQL/Storage/race partitions with mocks. Preserve 51 original ledger events exactly. A fresh standalone full GREEN is a stage baseline, not a new TDD baseline after historical GREEN. New defects, if discovered, use ordinary executable regression RED before correction, unchanged-test GREEN and full relevant verification. No external certification is inferred from local Auth/callback or Mailpit substitutes.

Actual integrated acceptance found that a stale text editor after another tab's avatar write returned outcome_unknown/503. Real PostgREST confirms SQLSTATE 40001 travels as HTTP 500. Ordinary real-SDK/MSW regressions failed for edit and completion before correction; both adapter paths now preserve this definite rollback for existing revision_conflict/412 mapping, while unknown 5xx remain uncertain. This is a minimal compatibility correction within existing contracts, not a boundary/schema/ADR change. Original TDD events remain untouched; new actual regression RED/GREEN and refactor regression logs are separate acceptance evidence.
