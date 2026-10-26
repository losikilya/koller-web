# Phase 3A security model

Auth owns credentials and immutable UUIDs. Public application tables never copy email, provider metadata, tokens or passwords. No service/secret key is read by application adapters. Public configuration accepts sb_publishable keys; legacy anon JWT configuration is allowed only for exact loopback hosts. This role decoding classifies configuration, never authorizes a user.

## Authorization and grants

Every application table enables RLS. anon has no base-table grants. authenticated has SELECT with auth.uid() = user_id and no direct INSERT/UPDATE/DELETE privileges. Owner mutations go through narrow definer RPCs that take no owner argument, verify auth.uid(), lock the profile and reject deleting accounts. Profiles/privacy/preferences use revision checks. Playground owner RPCs support only an empty version-one envelope with revision checks and serialized quotas; actual timer payloads remain unavailable until their application contract exists. SQL constraints reject invalid JSON shapes, versions and byte sizes independently of client validation.

Public RPCs use a dedicated NOLOGIN NOBYPASSRLS role with only SELECT on presentation/lifecycle/privacy columns and explicit role policies. API roles are not members of this role. Exact lookup checks public visibility and no pending deletion. Discovery additionally requires discoverable, uses UUID keyset pagination and caps pages at 50. RPC output is exactly user_id, username, display_name and bio. Raw avatar_path is never public; the DTO reserves avatarUrl=null until controlled delivery exists. Missing privacy, private, deleting and missing accounts all yield zero public rows.

All definer functions fix search_path, qualify objects and revoke default PUBLIC execute. Owner RPCs run as migration owner to insert application rows atomically; they explicitly authorize before every mutation. Public functions run as the narrower reader role. This is deliberate, separate privilege ownership. Review SQL grants as well as RLS; RLS alone does not restrict columns or superusers.

## Initialization and deletion

ensure_profile() derives UUID from auth.uid(), creates three rows in one transaction and preserves existing values on retries. It can repair missing privacy/preferences; missing privacy always denies publication. Username remains NULL until explicitly set; raw Auth metadata is ignored. Failure rolls back application initialization and can be retried after repair. There is no auth.users trigger, so application schema failures do not abort provider registration. Phase 3B must invoke the verified server initialization capability after establishing identity.

Auth deletion cascades SQL rows through profiles. No browser/API capability deletes auth.users or profiles. Storage cleanup, reauthentication, account-deletion orchestration and durable retry ledger remain later work; no avatar uploads exist in 3A.

## SSR and caches

Browser and server factories are separate. Server clients are request-scoped and marked server-only. Server fetch uses no-store; no shared cache wraps account reads. Proxy verifies the session with provider getUser and propagates cookie changes into the request and final localized response. Session-bearing and refreshed responses use private, no-store. Protected bootstrap independently verifies identity; proxy alone is insufficient authorization.

Cookie defaults use path /, SameSite=lax and Secure for HTTPS. SSR SDK requires browser-readable auth cookies, so HttpOnly is not asserted. No auth forms or mutation endpoints are added; Phase 3B must add same-origin/CSRF defenses for cookie-authenticated HTTP writes and ensure private/no-store on all account responses.

## Evidence limits

Only real local Supabase/PostgreSQL tests establish grants/RLS correctness. Unit tests cover contracts and adapter decisions. A missing Docker daemon is a blocked integration gate, not a passing test or behavioral RED. See implementation-report.md for actual execution outcomes.
