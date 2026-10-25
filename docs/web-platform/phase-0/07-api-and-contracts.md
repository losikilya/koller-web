# API and Shared Contracts

All endpoints are proposed future APIs, not existing Expo routes. The prompt's empty path segments are normalized to `{appId}` and `{recordId}`. Existing `src/domain/sync/wsProtocol.ts` is a separate LAN contract and is not the cloud API.

## Endpoint inventory

| Method/path | Authentication / authorization | Request -> response |
| --- | --- | --- |
| GET /api/v1/me | Verified user; own identity/profile only | -> MeDto, including own privacy/preferences |
| PATCH /api/v1/me/profile | Verified active owner, CSRF for cookies | ProfilePatch + If-Match -> OwnProfileDto + ETag |
| PATCH /api/v1/me/privacy | Verified active owner, CSRF | PrivacyPatch + If-Match -> PrivacyDto + ETag |
| PATCH /api/v1/me/preferences | Verified active owner, CSRF | PreferencesPatch + If-Match -> PreferencesDto + ETag |
| GET /api/v1/profiles | Public; only public AND discoverable | cursor/limit -> Page<PublicProfileDto> |
| GET /api/v1/profiles/{userId} | Public; exact public projection; private/missing/deleting 404 | -> PublicProfileDto |
| GET /api/v1/playground/apps | Public | -> catalog of manifests projected for clients |
| GET /api/v1/playground/{appId}/data | Verified active owner | cursor/limit -> Page<AppDataDto> |
| GET /api/v1/playground/{appId}/data/{recordId} | Verified active owner | -> AppDataDto + ETag |
| PUT /api/v1/playground/{appId}/data/{recordId} | Verified active owner, CSRF | AppDataWrite + conditional header -> AppDataDto; 201 create, 200 update |
| DELETE /api/v1/playground/{appId}/data/{recordId} | Verified active owner, CSRF | If-Match -> 204; already absent 204 |
| DELETE /api/v1/me | Verified user, recent reauthentication and explicit confirmation | deletion confirmation -> 202 request status; poll authenticated deletion status or localized completion |

Privacy belongs to /me/privacy, not publicly writable profile endpoints; preferences are not public profile presentation. Owner IDs come from verified principal, never body/query. Cloud data endpoints require login; the actual tool route remains public and uses local persistence for guests. AppId is allowlisted and validates the selected schema; unknown apps return 404. No clients can request arbitrary JSON schema acceptance.

## DTO shapes

```typescript
type PublicProfileDto = {
  userId: string; // UUID, permanent
  username: string | null;
  displayName: string;
  bio: string;
  avatarUrl: string | null; // access-controlled delivery, never bucket secret
};
type PrivacyDto = {
  visibility: 'public' | 'private';
  discoverable: boolean;
  showActivity: false; // reserved for future behavior
  revision: number;
};
type PreferencesDto = {
  locale: 'en' | 'ru'; schemaVersion: 1;
  settings: Record<string, never>; revision: number;
};
type OwnProfileDto = PublicProfileDto & { revision: number; updatedAt: string };
type MeDto = {
  userId: string; email: string; emailVerified: boolean;
  profile: OwnProfileDto; privacy: PrivacyDto; preferences: PreferencesDto;
};
type AppDataDto = {
  appId: 'practice-timer'; recordId: string;
  schemaVersion: 1; payload: PracticeTimerPreset;
  revision: number; createdAt: string; updatedAt: string;
};
type AppDataWrite = { schemaVersion: 1; payload: PracticeTimerPreset };
type Page<T> = { items: T[]; nextCursor: string | null };
type ApiError = {
  error: {
    code: string; message: string; requestId: string;
    details?: { path: string; code: string }[];
  };
};
```

PracticeTimerPreset is defined in [09](09-practice-timer-specification.md). DTOs use ISO UTC timestamps, UUID strings and safe integer revisions. Own email never appears in PublicProfileDto. ProfilePatch permits only displayName/bio/username (avatar through controlled upload workflow); PrivacyPatch permits visibility/discoverable, with showActivity=false only; PreferencesPatch initially locale. Reject unknown keys and empty patches. Missing fields mean unchanged; nullable fields require explicit null, with endpoint-specific support. Publishing requires valid display name; private transition sets discoverable=false atomically.

## Validation and transport

Propose Zod as runtime schema tooling for TypeScript contracts; its presence in mobile package.json does not mean existing mobile validation is reusable. Define strict schemas for UUIDs, timestamps, lengths, enums, finite integer durations/rounds, JSON byte budgets and supported versions. Both client and server validate; DB performs critical ownership/schema/budget checks. Validate before adapter invocation. Browser JavaScript is not a trusted boundary.

Canonical language-neutral contract is OpenAPI (proposed 3.1, verify tool compatibility in Phase 1), with cookie and bearer security schemes, endpoint response schemas, examples and error codes. Zod and OpenAPI must be checked for equivalence rather than manually diverging. Generate clients only during approved implementation. Expo can consume HTTP/OpenAPI without React/Next.js dependencies. APIs do not embed locale in paths; stable codes drive localized UI messages. Server message is diagnostic fallback, not final translated UI copy.

Route handlers perform HTTP parsing/authentication/validation and result mapping. Framework-independent focused functions accept Principal and DTOs, enforce rules, and call adapters. Supabase adapter uses caller identity and restricted functions described in [06](06-database-and-privacy.md). No generic repository framework is proposed for single-record operations.

## Errors and consistency

| Status | Stable codes / behavior |
| --- | --- |
| 400 | invalid_json, invalid_cursor, invalid_request; malformed body/query |
| 401 | unauthenticated, session_expired; no valid credential |
| 403 | forbidden, reauthentication_required, account_deleting; authenticated request denied |
| 404 | not_found; private/missing public profile and unknown/non-owned preset use identical shape |
| 409 | username_unavailable, quota_exceeded, duplicate_record; business conflict |
| 412 | revision_conflict; If-Match differs from stored revision |
| 413 | payload_too_large; bytes exceed ingress/DB budget |
| 422 | validation_failed, unsupported_schema_version; parsed but invalid payload |
| 428 | precondition_required; required conditional header absent |
| 429 | rate_limited with Retry-After |
| 500/503 | internal_error/service_unavailable; no SQL/provider/token details |

PUT create requires If-None-Match: *; update/delete require If-Match with opaque strong ETag encoding revision. A UUID recordId makes create retry idempotent by identity; a failed create precondition triggers GET and comparison, not blind overwrite. After lost update response, GET determines whether intended payload was saved. Offline cloud drafts retain base revision; conflict UI offers reload or Save Copy with new UUID. No last-write-wins silently replaces another device's changes. Deletion of an absent owner record returns 204 for safe retry, while non-owner records behave absent. Profile/privacy/preferences have independent revision counters.

Pagination proposal: default 20, max 50. Profiles ordered by stable user_id cursor; presets ordered by updatedAt,recordId descending with a composite opaque cursor. Validate cursor shape and ordering; omit total counts initially. Snapshot pagination under concurrent edits is not promised. Counts/quotas are enforced separately by transaction, not list length.

Public profile and all personal responses use no-store initially. Catalog is cacheable with versioned metadata. Apply bounded body size before JSON parsing, request IDs, same-origin protections and route-specific shared rate limits. /api/v1 includes additive compatible changes only; breaking DTO/semantics introduce /v2 with a support window. JSON payload schemaVersion is independent from HTTP API version and app manifest version.

## Required future contract tests

Anonymous guest catalog/tool access; unauthenticated cloud writes; forged owner/appId; non-owner data; public/non-discoverable direct lookup versus listing; private/deleting indistinguishability; unsafe callback redirects; malformed/oversized/versioned payloads; concurrent quota insertion; create retry; stale revision; localization of each user-visible code; OpenAPI schema and bearer client parity. See roadmap for phase ownership.
