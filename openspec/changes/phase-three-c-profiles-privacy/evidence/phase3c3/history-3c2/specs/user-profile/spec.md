# User Profile Spec Delta

## Purpose

Let verified owners inspect and maintain their profile presentation safely while preserving private defaults and provider-owned identity.

## ADDED Requirements

### Requirement: FR-401 Private owner projection

The system SHALL return only the verified active owner's profile presentation and independent profile/privacy revisions. Owner responses SHALL exclude storage paths, email, deletion markers and other users' data. Revisions SHALL remain lossless positive decimal strings through signed-bigint range, represented by strong profile ETags.

#### Scenario: SC-401 Read the owner projection

- **WHEN** an owner reads their active initialized profile
- **THEN** the safe projection and lossless profile ETag are returned, while missing/inactive records are explicit safe errors

### Requirement: FR-402 Normalized revisioned editing

The system SHALL allow username, displayName and bio changes only through the verified owner's existing revisioned RPC. Handles SHALL trim ASCII spaces and lowercase ASCII; empty handles become null only for incomplete drafts; completed handles cannot be cleared. Names trim ASCII spaces, bio normalizes CRLF. Unknown/empty patches SHALL fail. Old handles SHALL be immediately reusable with a visible warning; UUID identity SHALL remain unchanged.

#### Scenario: SC-402 Save canonical presentation

- **WHEN** an owner submits valid presentation fields or invalid input
- **THEN** valid data is normalized and saved, invalid data is rejected before persistence, and duplicate/stale failures map to safe stable codes

### Requirement: FR-403 Protected profile transport

Owner HTTP reads and PATCH SHALL verify identity, preserve refreshed cookies and prohibit caching. Cookie mutations SHALL require exact origin, JSON, at most 16 KiB actual UTF-8 bytes and a valid strong If-Match. Errors SHALL expose stable codes only. Saves SHALL reload current state; uncertain outcomes SHALL require explicit reload rather than automatic retry.

#### Scenario: SC-405 Enforce HTTP preconditions

- **WHEN** callers omit or forge origin, identity, input or profile revision
- **THEN** transport rejects safely with 400/401/403/409/412/413/415/422/428/503 as applicable, without private fields or provider errors

### Requirement: FR-404 Localized accessible owner editing

My Profile SHALL exist at both localized account/profile routes with server-verified access, bootstrap recovery and noindex metadata. Editing SHALL have named controls, keyboard support, announced feedback, duplicate-submit protection and cancellation cleanup. Failed/conflicting saves SHALL retain drafts and offer explicit reload. Successful saves SHALL display the fresh current server state.

#### Scenario: SC-418 Preserve drafts and reload deliberately

- **WHEN** a save conflicts, validation/network fails, or a pending editor unmounts
- **THEN** drafts survive failures, reload is explicit, pending actions cannot duplicate and owned requests abort on unmount

#### Scenario: SC-419 Use localized owner routes

- **WHEN** an owner navigates from account, edits a profile and switches EN/RU by keyboard
- **THEN** the owner route, translated controls, safe metadata, focus and responsive layout remain usable

### Requirement: FR-405 Existing database arbitration

The system SHALL preserve direct-RPC ownership, private defaults, independent revisions and database uniqueness/locking. Simultaneous same-handle claims and same-revision edits SHALL admit one winner without overwriting another user's data. Decimal-string revisions above JavaScript safe-integer range SHALL update exactly and reject stale writes.

#### Scenario: SC-420 Existing real database guards

- **WHEN** real anonymous/owner/non-owner clients race profile mutations and use large revisions
- **THEN** ownership, uniqueness, revision conflicts, immediate handle reuse and privacy invariants remain enforced

### Requirement: FR-406 Explicit public completion

The system SHALL require a unique valid username and nonblank displayName for explicit owner completion, with bio optional. Completion SHALL atomically check independent profile/privacy revisions, mark completed and make public. Existing records SHALL remain incomplete until this action. Completed required fields SHALL not be cleared and completed profiles SHALL not be hidden through RPC/DB paths.

#### Scenario: SC-421 Atomic completion and direct database protection

- **WHEN** real owner/anonymous/other clients attempt publication, completion, required-field edits and concurrent claims
- **THEN** incomplete records remain nonpublic, only valid revisioned owner completion publishes, and concurrent/bypass attempts preserve completion/public/field invariants

### Requirement: FR-407 Mandatory completion routing

Verified incomplete accounts SHALL reach localized account/profile after login/callback and SHALL not bypass completion through document/RSC/protected-data navigation. Guests SHALL retain public access. Essential auth/recovery/logout/bootstrap/completion operations SHALL remain usable, unknown routes SHALL stay 404 and dependency failures SHALL fail closed rather than become guest access.

#### Scenario: SC-422 Gate routes and safe auth returns

- **WHEN** incomplete users request application routes, protected operations or manipulated login/OAuth return paths
- **THEN** they remain in completion, while guests and essential recovery paths remain functional without loops

### Requirement: FR-408 Unindexed public profile projection

The system SHALL SSR localized current-username public pages using only approved presentation fields. Public reads SHALL require explicit completion, visibility and active privacy/lifecycle state. Missing/private/incomplete/deleting/missing-privacy lookups SHALL be indistinguishable without owner fallback; dependency errors SHALL fail safely. HTML/RSC/metadata/HTTP/errors SHALL be no-store and noindex/nofollow, with canonical/language continuity and no sitemap inclusion.

#### Scenario: SC-423 Safe public projection and metadata

- **WHEN** public profiles and unavailable cases are requested by anonymous, owner and other clients
- **THEN** safe current-handle content or generic unavailable is returned without private data, indexing or shared caching

### Requirement: FR-409 Accessible completion onboarding

The localized editor SHALL explain public publication and require only username/displayName for completion. It SHALL preserve independent lossless revisions, drafts and reload-required after uncertain writes. Refresh/manual URL/back-forward SHALL not bypass incomplete onboarding; completed users SHALL retain normal subsequent login/navigation and accessible public locale switching.

#### Scenario: SC-424 Complete and navigate in EN and RU

- **WHEN** users log in, attempt navigation before completion, explicitly complete and revisit their public profile
- **THEN** onboarding cannot be bypassed, mandatory validation/conflicts are accessible and the completed/public localized route works with keyboard, responsive SSR and no indexing

#### Scenario: SC-425 Refresh and manual navigation cannot bypass completion

- **WHEN** incomplete users refresh, navigate manually or through history, then complete and revisit public EN/RU pages
- **THEN** the mandatory gate, safe auth exceptions, explicit publication and accessible noindex SSR remain enforced
