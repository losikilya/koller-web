# Design

## Context

See proposal.md and Phase 3C.0 audit. Existing SQL already provides all 3C.1 writes. Original full GREEN ran before production edits; exact log will be copied into evidence/baseline.txt. No SQL changes or new dependencies are needed.

## Goals / Non-Goals

Goals: minimal Profile bounded-context extension and lossless caller-JWT HTTP/UI flow. Non-goals: future privacy/public/avatar stages, auth redesign, history redirects and reservation infrastructure.

## Decisions

D-01–D-03 recommended defaults and D-06 immediate reuse accepted by the current explicit implementation instruction (2026-10-27). Keep original planning findings as history; append accepted-decision record. `/account` retains Identity bootstrap; `/account/profile` owns Profile UI. App verifies principal and composes a narrow service/adapter. Client editor imports contracts/local files, never its own barrel. Adapter has no runtime server-only dependency in the mixed public barrel. Existing cookie response context is extracted inside app infrastructure, preserving Auth behavior.

Owner SELECT uses explicit columns, deletion guard and `revision::text`; privacy has its own decimal revision. Shared Supabase wire typing override models bigint RPC decimal-string input; generated file stays unchanged. Validate canonical positive decimal ≤ signed bigint max; never convert to Number. ETag is a quoted opaque `profile-<revision>`. Missing records trigger safe bootstrap-incomplete/retry via existing account recovery. No owner ID/path in mutation input.

Use normalized form patch schema separate from canonical existing SQL schema. Post-write read gives reload-current semantics; if a newer state differs, UI explains it. If write succeeded but reload failed, expose outcome_unknown and require explicit reload; never automatically replay. Conflict keeps draft/base ETag until explicit reload. Save failure never changes inputs. Busy editor disables all controls; abort on unmount. No persistent cache/auth store. All transport replies have no-store; metadata noindex. Exact configured Origin protects PATCH. Stream body bytes with a strict limit before JSON parse. HTTP uses safe errors and ETags, not SQL messages.

## Risks / Trade-offs

Handle conflict still reveals unavailability; no bulk availability endpoint. Immediate reuse can reassign old links, so warn before edits and add no old-name redirects. Revisioned writes are separate from post-write reads; explain refreshed differing state. Independent privacy revision does not publish a reviewed profile snapshot. No release/deployment abuse-control or Storage certification is implied.

## Architecture consultation and migration

Read-only architect found no blocker and recommended a NEW Profile ownership ADR without superseding accepted principles. Installed PostgREST parser supports casts and preserves RPC arguments; real tests must prove decimal-string acceptance. No migration, generated-type rewrite or dependency is needed. Existing recovery FR-303 remains regression protected. The change remains active; later stages require separate authorization/planning updates and are not part of this increment's readiness claim.
