# ADR-0005: Explicit completion, mandatory onboarding and public profiles

Status: Accepted for revised Phase 3C.2, after explicit user policy approval and read-only architect consultation.

Supersedes: the optional user public/private choice in accepted Phase 0 ADR-012 **for the current completed-profile product policy**. Private defaults still apply to incomplete bootstrap; internal visibility/discovery infrastructure is retained. Extends ADR-0004 without changing ownership, UUID identity, independent revisions or modular-monolith boundaries. The earlier proposal/history is preserved rather than edited as if always accepted.

## Decision

Explicit nullable completed_at distinguishes provisional records from owner-confirmed public presentation; no inference/backfill from existing username/name/visibility. Completion validates mandatory unique username and nonblank displayName, then atomically sets completion/public state under profile → privacy locks with both revision preconditions. Bio remains optional. Completed required fields cannot be cleared and completed profiles cannot be hidden by RPC. Existing public readers require completion, public visibility and active privacy/lifecycle predicates. All profile pages are noindex/nofollow/no-store; no indexing signal/sitemap/catalog is introduced.

App owns route/API gate and safe auth return composition; Profile owns completion state/use cases/persistence. Shared provider infrastructure remains domain-agnostic and may pass verified context to an async app callback. Route adapters also guard before data/rendering. Essential auth/recovery/logout/bootstrap/assets and completion APIs stay usable; unknown routes remain 404 and guests retain public access. Existing protected domain-data RPCs independently require completion to prevent direct provider bypass.

The existing boundary checker treats the root Next proxy separately from app route modules. Static locale/route-kind classification therefore lives in the existing shared i18n catalog; completion/session/recovery decisions remain in the app adapter and root framework proxy. No checker exception or domain state is introduced into shared infrastructure. Read-only architect review accepted this minimal split.

## Consequences

One additive local migration without reset or mass publication, actual generated types and adversarial concurrency acceptance are required. Existing uncompleted records stay gated/nonpublic until a clear owner action, even if an old internal flag was public. Internal visibility remains available for future policy evolution. Unicode White_Space nonblank validation uses an explicit shared set; zero-width format validation is not implied. The detailed route matrix and policy are in `docs/web-platform/phase-3c/05-revised-completion-policy.md`.
