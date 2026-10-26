# Design

## Context

See proposal.md and Phase 0 identity/database/API documents. ADR-0002 remains authoritative. Architect consultation: ADR impact NONE; sequential read-only inspection completed before implementation.

## Decisions

Use shared/supabase for generic config, SDK factories and database types; app/\_infrastructure for Next cookie adaptation; modules/identity for verified initialization. No service key adapter or new HTTP endpoints. Existing next-intl response is composed with refresh cookies and cache headers.

Use owner-only base SELECT, revoke direct DML, and expose narrow authenticated mutation RPCs. A separate NOLOGIN/NOBYPASSRLS role owns public projection functions and receives explicit column grants and role-specific RLS. All definer functions qualify objects and fix search_path. No API role membership in privileged roles.

Initialize through no-argument ensure_profile RPC using auth.uid(), one transaction, ON CONFLICT DO NOTHING and nullable username. No auth.users trigger: Auth creation cannot fail due to application bootstrap. Phase 3B calls initialization after verified identity; errors are explicit and safe to retry. Cascades remove SQL data; storage/admin account deletion is deferred.

Use UUID id plus unique(user_id,app_key,data_key), as requested, refining Phase 0 illustrative composite key. Retain revisions and deletion_requested_at for agreed lifecycle boundaries. show_activity stays false. Theme supports system/light/dark. No arbitrary preferences settings column without a consumer. Playground storage accepts only an empty version-one object in 3A; no timer payload contract or writes are invented. Future app payloads require a migration and contract change. Bounded JSON storage checks remain independently tested.

Username is nullable or 3–30 lowercase ASCII characters starting with a letter; reserve admin, support, system. Display name max 80 Unicode code points, bio max 500. Avatar path reserved nullable and cannot be written through profile RPC. Publication requires a nonblank display name. Preferences support en/ru. Public DTO has avatarUrl null until delivery exists.

## Risks / Trade-offs

- Initial Docker blocker was recovered: real SQL/REST tests now execute against local PostgreSQL. Historical missing database RED and original full GREEN remain explicit workflow gaps; passing recovery checks cannot recreate them.
- Types now come from successful local CLI generation. Preserve raw output and adjust public RPC username nullability at the SDK boundary using underlying table types; real REST acceptance verifies nullable usernames.
- Remote legacy anon keys rejected; local legacy JWT compatibility checks decoded role only for configuration classification, never authorization. Auth verification remains provider-backed.
- Bootstrap is application-driven: authenticated account can temporarily lack rows; private deny defaults and idempotent retry handle this safely.

## Migration Plan

Apply schema/constraints first, then roles/RLS/RPC grants. Reset only disposable local database. Production rollout and rollback are outside scope; do not run linked/cloud commands. Run local migration, pgTAP and distinct JWT REST checks before approval.
