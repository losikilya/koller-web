# Revised Phase 3C.2 — Mandatory completion and public profiles

Status: authorized policy revision, 2026-10-27, reviewed by the read-only architect before SQL implementation. This prospectively replaces the optional publication/hide UX and indexable-discoverable SEO proposals from Phase 3C.0. Historical planning and 3C.1 evidence are preserved under the active change's `evidence/phase3c2/history-3c1`, with exact hashes. This revision does not reinterpret earlier tests as evidence of the new behavior.

## Accepted policy and minimal model

Only username and displayName are mandatory; bio is optional. Completion is an explicit owner action with clear EN/RU notice that presentation becomes public. Add `profiles.completed_at NULL` without backfill or invented handles. All existing rows remain incomplete until the owner explicitly completes, including rows with an old internal public flag. Effective public reads require completion, current public visibility, privacy row and no deletion marker. No existing private record is bulk-published and no bulk visibility rewrite is needed.

Completion atomically checks canonical mandatory fields and **both** current profile/privacy revisions, then marks completion and publishes with discoverable=false. A completed owner cannot clear mandatory fields or switch private through direct RPC/editor; no hide toggle exists. The internal privacy model/RLS/grants remain for future extensibility. Username rename retains immediate reuse, warning, no redirect history and UUID identity.

Display-name validity keeps the existing 80-code-point maximum and ASCII-space normalization, and additionally requires a non-White_Space character. Use the explicit Unicode White_Space set in both contracts and SQL: U+0009–000D, U+0020, U+0085, U+00A0, U+1680, U+2000–200A, U+2028, U+2029, U+202F, U+205F, U+3000. Format/zero-width characters are not implicitly prohibited. Username keeps the existing canonical lowercase ASCII/reserved/uniqueness rules.

All profile pages are noindex/nofollow, with HTTP robots headers and no-store HTML/RSC/metadata/errors. No indexing signal, sitemap entry, catalog or search UI is introduced. Discoverability is independent from search-engine indexing; the existing list reader keeps its filtered contract with an additional completion predicate.

## Route/API matrix and safe returns

| Surface                                                                        | Guest                           | Verified incomplete account                                                | Completed account                                                   |
| ------------------------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Existing Home/Playground/tool pages and public username pages                  | Existing public access          | Redirect to localized `/account/profile` before app content/data rendering | Normal access                                                       |
| `/account/profile`                                                             | Localized login                 | Completion/editor, no redirect loop                                        | Normal editor                                                       |
| `/account?bootstrap=retry` recovery                                            | Login                           | Allowed recovery surface only; ordinary `/account` redirects to completion | Normal account                                                      |
| Login/register/forgot/reset, confirmation/Google callback                      | Existing auth behavior          | Essential auth/recovery remains available                                  | Existing behavior                                                   |
| Auth mutations, logout/bootstrap/recovery/reset                                | Existing verified/origin checks | Allowed essential operations                                               | Existing behavior                                                   |
| Owner GET `/api/v1/me`, profile PATCH and completion POST                      | 401                             | Allowed owner-only completion operations                                   | Allowed owner-only editing; completion replay needs valid revisions |
| Protected domain/data operations, including direct Playground write/delete RPC | Existing auth contract          | 403/SQL permission denial `profile_incomplete`                             | Existing ownership/quotas/revisions                                 |
| Assets, `_next`, essential framework resources                                 | Allowed                         | Allowed                                                                    | Allowed                                                             |
| Unknown locales/routes or malformed handles                                    | 404                             | 404 rather than arbitrary return-path redirect                             | 404                                                                 |

Proxy uses app-owned policy with verified request-scoped context; shared Supabase only propagates the callback/client/cookies. Server route adapters independently await the same gate before app/public data reads; layout/Shell alone is insufficient. Completion-read failures fail closed as a safe unavailable response, not guest access. Document, RSC/prefetch, refresh, hard URL and back/forward requests follow this policy. Already received browser bytes cannot be remotely erased; new protected reads/writes remain denied.

After successful email/password login, Google callback and signup confirmation/bootstrap, app composition resolves completion: incomplete overrides any allowed/manipulated return to `/locale/account/profile`, completed follows only the existing safe allowlist. Recovery callback always reaches reset first; reset remains functional and subsequent navigation follows the gate. Bootstrap failure reaches allowed `/account?bootstrap=retry`. Completing successfully refreshes server state and remains on the editor or a safe account route; future logins do not repeat onboarding. Logout remains available from completion.

Public readers never fall back to an owner DTO. Their missing/private/incomplete/deleting/missing-privacy result is the same empty/not-found result for owner, other user and anonymous callers. For document navigation, the authenticated-incomplete gate takes precedence regardless of target and discloses no target state. Public page rendering for guests/completed visitors uses generic localized unavailable metadata/body; provider dependency failure is a safe service-unavailable response. No email/preferences/internal privacy rows or completion timestamp is public.

## Persistence, concurrency and migration

Add one reviewed local migration, no reset/remote command. Keep nullable bootstrap and `lock_owner` usable for drafts/completion. A separate completion-required owner helper protects existing domain-data RPCs under the same profiles lock. Completion lock order is profiles → privacy; claims use the existing unique index. Completed local required-field CHECK and deferred completed/privacy-public consistency checks enforce database invariants in addition to RPC checks. Missing privacy remains fail-closed for public reads; verified bootstrap may repair it according to explicit completion state.

Existing UUID/list function signatures/projections remain compatible, with the approved additional completion eligibility check. New restricted username function returns the same four presentation columns; its NOLOGIN/NOBYPASSRLS role gains only completed_at column access and still cannot read avatar_path. No service-role username lookup or widened base-table grants.

Apply pending migrations only to the existing local stack, then generate actual local database types and verify real anon/owner/other JWT contexts, concurrent completion/rename/edit/public reads, required fields, raw RPC bypasses and old public records without completion. Existing fixture tests that previously assumed optional publication are prospectively updated to the new policy; original bytes/results remain preserved. Real BDD/TDD for new requirements starts with behavioral failures before migration/code; no setup failure is counted as RED.

## Deferred scope

Avatars/Storage/activity, catalog/search, community/follows/events/battles, account deletion and Phase 4 remain excluded. Live Google/external SMTP/remote CI are not certified by local controlled callback tests. No archive, commit, push, deployment, new credentials or external service configuration.

Client navigation/back-forward revalidation uses a minimal own-completion-state endpoint and app-owned transient guard; no persistent auth store is introduced. SSR remains authoritative and no-JS public presentation still renders.

The minimal `/api/v1/me/completion` session-state endpoint returns 200 with authenticated=false/completed=false for guests (no account data), and verified own completion state otherwise. This avoids intentional guest HTTP errors during background/history revalidation; protected owner data endpoints still return 401. Background revalidation preserves existing guest DOM/focus rather than unmounting the shell.
