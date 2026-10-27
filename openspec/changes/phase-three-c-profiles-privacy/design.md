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
