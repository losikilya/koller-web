# Phase 3C — Acceptance and test plan

**Planning examples only.** SC-401–SC-417 and FR-401–FR-408 below are draft identifiers within the proposed future `phase-three-c-profiles-privacy` change. No canonical feature/steps/test-plan.json, test scaffold or RED/GREEN/REFACTOR evidence is created in 3C.0. Resolve [open decisions](04-open-decisions.md), then turn these examples into executable, uniquely tagged Gherkin under `tests/bdd/profile` / `tests/e2e/profile`. Browser scenarios additionally require real playwright-bdd execution; Markdown Gherkin is not acceptance execution.

## Proposed requirement mapping and observable examples

### FR-401 — Verified owner profile access

```gherkin
Scenario: SC-401 Read only the verified owner's active profile
  Given two verified users with separate profiles and private defaults
  When the first user opens My Profile and requests the owner API
  Then only their whitelisted presentation fields and own revisions are returned
  And anonymous owner access is rejected without returning profile fields
  And supplying another userId does not select that user's profile
  And deleting-account access does not return an editable profile
```

### FR-402 — Validated profile editing

```gherkin
Scenario: SC-402 Save username, display name and bio
  Given an active owner and the current profile ETag
  When they save a mixed-case ASCII handle with surrounding spaces and Russian presentation text
  Then the server stores the approved normalized handle and text
  And returns the current owner state and its lossless ETag
  And omitted fields remain unchanged and an explicit empty handle follows the approved null policy
  And the form announces success without accepting duplicate pending submissions

Scenario: SC-403 A claimed username is unavailable
  Given another profile already owns a valid handle, whether private or public
  When an owner saves the same normalized handle
  Then the server returns 409 username_unavailable with no owner's identity or privacy reason
  And the original profile and revision remain unchanged
  And the draft remains available for correction

Scenario: SC-404 Reject invalid or untrusted fields
  Given an active owner
  When profile input contains unknown owner/path/role keys, an empty patch, invalid handles or oversized text
  Then strict server validation rejects it before persistence
  And code-point boundaries at 80 name and 500 bio characters accept valid Russian and emoji text
  And unsupported raw canonical handles are also rejected through direct RPC
  And literal HTML is displayed as text and never executed

Scenario: SC-405 A stale edit does not overwrite newer data
  Given two editors loaded the same profile revision
  When one saves and the second submits its original ETag
  Then the second receives 412 revision_conflict and the first edit is retained
  And missing If-Match returns 428 and malformed If-Match returns 400
  And the losing editor retains its draft and offers an explicit reload
  And a lost successful response is resolved by reading current state rather than blind replay
```

### FR-403 — Owner privacy and publication

```gherkin
Scenario: SC-406 Publish an eligible profile
  Given an owner with a valid current display name and privacy revision
  When they publish using the current privacy ETag
  Then visibility becomes public and showActivity remains false
  And the result follows the approved nullable-username and current-snapshot publication policy
  And a stale privacy revision fails without changing privacy
  And publishing a blank display name fails through HTTP and direct RPC

Scenario: SC-407 Hide a previously discoverable profile
  Given a public discoverable profile and previously issued page and avatar URLs
  When the owner changes visibility to private
  Then discoverable becomes false atomically
  And subsequent public page, metadata, discovery and avatar authorization denies access
  And responses do not come from a shared stale cache
  And publishing again does not silently restore discovery consent
```

### FR-404 — Safe public lookup and discovery

```gherkin
Scenario: SC-408 Open a public non-discoverable profile directly
  Given a public profile whose discoverable flag is false
  When anonymous and signed-in non-owner visitors use its exact username URL
  Then each receives the same approved presentation fields
  And the profile is absent from public list/search consumers
  And robots metadata and headers prohibit indexing

Scenario: SC-409 Rename a handle without changing identity
  Given a public profile with a handle and immutable UUID
  When the owner changes the handle
  Then the new localized URL resolves to the same UUID with a matching canonical URL
  And the old handle follows the explicitly approved release or reservation policy
  And no private redirect history or authorization is inferred from a stale handle

Scenario: SC-410 Unavailable public profiles do not disclose private data
  Given private, missing, deleting and missing-privacy profile cases
  When anonymous, owner and other signed-in visitors request each public URL
  Then all unavailable cases have the same generic 404 contract and noindex
  And HTML, RSC payload, metadata, headers and JSON contain no protected presentation or owner fields
  And a dependency failure returns a generic service failure without leaking the requested account
```

### FR-405 — Enforced ownership and race safety

```gherkin
Scenario: SC-411 Direct provider access cannot bypass ownership
  Given anonymous, owner and other-user credentials
  When they query base tables or call profile and privacy mutations directly
  Then anonymous base reads and protected execute are denied
  And another user's base rows are not returned
  And direct product DML and forged owner/path fields are rejected
  And public projection grants and returned keys remain restricted

Scenario: SC-412 Concurrent claims and publication preserve invariants
  Given two users simultaneously claim the same canonical handle
  When both writes execute against real PostgreSQL
  Then exactly one succeeds and the other fails on uniqueness
  And two same-revision profile edits cannot both succeed
  When publication races with clearing a display name
  Then serialized results never leave a public profile with a prohibited blank name
  And profile and privacy revisions remain independently enforced
```

### FR-406 — Safe avatars and durable cleanup

```gherkin
Scenario: SC-413 Validate and attach an avatar safely
  Given a verified active owner and the current profile revision
  When they select and upload an image within approved byte and decoded-pixel limits
  Then server validation and re-encoding remove metadata before attachment
  And only the controlled opaque application URL is returned
  And spoofed types, SVG, animation, traversal, oversized or undecodable content fail safely
  And anonymous and non-owner raw Storage operations cannot read or mutate the object
  And no service credential or bucket locator reaches the browser

Scenario: SC-414 Replace and remove avatars with concurrent or failed operations
  Given an owner with a current avatar
  When a replacement uploads but its revisioned association fails
  Then the current avatar remains and only the unattached upload is scheduled for cleanup
  When a replacement commits or removal succeeds
  Then the previous avatar URL stops authorizing bytes and its object is queued for deletion
  And a stale concurrent upload or retry cannot replace or delete the current avatar
  And a failed physical delete remains retryable without restoring visibility

Scenario: SC-417 Recover orphaned upload and cleanup work
  Given durable pending or cleanup records and an unavailable Storage dependency
  When processing restarts after crashes before upload, after upload or after pointer commit
  Then reconciliation safely resumes or removes only unattached obsolete objects
  And operation retries have an idempotent outcome
  And profile or Auth deletion does not erase the minimal cleanup reference prematurely
  And unauthenticated callers cannot trigger arbitrary cleanup work
```

### FR-407 — Localized SSR, SEO and accessible interaction

```gherkin
Scenario: SC-415 Render and navigate accessible EN and RU profile pages
  Given public discoverable and non-discoverable profiles
  When a visitor opens each English and Russian URL without client JavaScript
  Then approved presentation content is server rendered
  And title, description, canonical and reciprocal language alternatives match the authorized current handle
  And indexing is allowed only by the approved discoverability signal
  When they switch locale, edit profile, change privacy or select and remove an avatar by keyboard
  Then the equivalent logical route and current handle are preserved
  And labels, errors, loading, success and unavailable text are localized and announced
  And focus, reduced motion and 320px reflow remain usable
  And unknown locales and malformed profile routes return the unavailable route contract
```

### FR-408 — Bootstrap recovery and preserved auth

```gherkin
Scenario: SC-416 Recover an incomplete bootstrap without losing authentication
  Given a verified session and a transient bootstrap failure
  When the owner opens profile management and follows the existing verified retry
  Then no partial owner DTO or accidental public profile is returned
  And the session survives and one private non-discoverable profile is initialized
  And existing profile/preferences are preserved on repeated successful bootstrap
  And registration, recovery feedback, logout and guest tools keep their stable behavior
```

## Layer ownership and evidence

| Layer                        | Lowest meaningful checks                                                                                                                                                                                                        | Planned paths / evidence                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                         | SC-402/404 normalization and code-point partitions; SC-405 ETag/error mapping; safe DTO/metadata mapper; avatar signature/budget/operation transitions                                                                          | `tests/packages/contracts/profile.test.ts`, `tests/apps/web/modules/profile/{profilePolicy,profileService,avatarService}.test.ts`; use explicit package exports/@ alias and no React for pure logic.                                                                        |
| Integration / RTL / HTTP     | SC-401–407 owner API/form, strict JSON bytes/content-type, Origin, auth refresh cookies even on failure, 401/403/409/412/428/413/422/503, no-store; unmount/abort/double-submit; no field values in errors                      | Mirrored module tests and `tests/apps/web/app/_infrastructure/profile.test.ts`; MSW only for actual HTTP, injected ports for use cases. Metadata integration inspects response HTML/RSC, not just a mocked title function.                                                  |
| Real PostgreSQL/RLS          | SC-403/405–412/416: actual anon/owner/other JWTs, function grants/owner/search_path, strict result keys, reserved/case handles, transaction races, missing privacy/bootstrap rollback, active account state                     | Future `supabase/tests/profile.test.sql`, `tests/database/profile.test.ts` and adjacent runner; preserve existing identity SQL suite. Use genuine barriers/concurrent connections, not sequential writes labelled concurrent.                                               |
| Supabase Storage integration | SC-413/414/417: private bucket metadata and all raw role operations; uploads, re-encoding, current pointer checks, private/public transition, cleanup failure/crash and retry                                                   | `tests/database/avatar.test.ts` with actual enabled local Storage and isolated fixtures; drive real service adapter endpoint as well as raw Storage REST. Mocked buckets or service-role-only success are insufficient. Add to root verify orchestration in implementation. |
| Browser E2E                  | SC-401–410/413–416: login + My Profile → edit → publish → guest direct link → hide → avatar; locales, dynamic route language switch, SSR/no-JS, actual status/headers/metadata, session boundaries/back navigation              | Canonical `tests/e2e/profile/*.feature` + adjacent playwright-bdd steps; plain security probes `.spec.ts`; browser scenarios still map to focused Vitest drivers per current test-plan schema.                                                                              |
| Accessibility                | SC-415 plus form-specific loading/error/conflict and avatar feedback; semantic labels, keyboard/file chooser, focus/error summary, dialog restoration, image alternatives, axe and manual screen-reader/keyboard critical flows | RTL at observable form boundary, actual app browser at narrow/wide viewport, shared Storybook regressions unchanged; axe complements manual verification.                                                                                                                   |

## Future RED/GREEN/REFACTOR sequence

1. Resolve relevant D decisions and owner authorization; obtain installed CLI instructions and create the single behavior change. Map each canonical scenario to one focused Vitest file (`layer: unit` or `browser` supported by current schema), requirement and feature; browser additionally runs playwright-bdd. SQL/Storage are explicit real acceptance commands, not unsupported invented test-plan layer values.
2. Declare existing invariant scenarios as `cycle: baseline` with concrete reasons before implementation and before any GREEN. Existing SQL grants/private defaults/auth recovery must stay unchanged. Mixed examples must separate existing guard assertions from new UI/HTTP/projection behavior when assigning executable IDs. Do not retroactively mark an all-new scenario baseline because some underlying SQL passes.
3. Record original full GREEN and real SQL baseline. Build loadable test scaffolds using current interfaces, then `pnpm workflow check phase-three-c-profiles-privacy`. Missing imports, browser, decoder or Storage setup is a setup blocker, never RED.
4. Run `pnpm tdd phase-three-c-profiles-privacy SC-xxx red`, inspect a behavior assertion failure; implement the minimum; run green then refactor with unchanged assertions. If a test is wrong, document correction and restart the cycle. Do not write fabricated timestamps/hashes or manually manufacture evidence.
5. After staged focused checks run full `pnpm verify`, explicit new SQL/Storage commands, generated-type comparison and manual accessibility acceptance sequentially. Record actual exit codes, infrastructure limits and failed attempts. Test retries may not conceal failures.
6. Independent read-only reviewer checks requirements/evidence and architecture/engineering, at most two passes. Record actual verdict; rerun material fixes. Only then workflow ready, owner acceptance and any separately authorized native archive. Phase 3C.0 runs none of these future TDD cycles.
