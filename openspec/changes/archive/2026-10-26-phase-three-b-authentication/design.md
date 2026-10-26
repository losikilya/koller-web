# Design

## Context

See proposal.md. Reuse Phase 3A request-scoped Supabase SSR clients, proxy refresh and ensure_profile RPC. No SQL change or additional auth framework is needed.

## Goals / Non-Goals

Implement user-auth; preserve all Phase 3A privacy contracts and existing guest tools. No profile management or global auth store.

## Decisions

Identity owns provider-facing authentication services and interactive forms through explicit public exports; app owns writable cookie adapters, same-origin POST handlers, token-hash confirmation and PKCE callback. Shell composes verified navigation. Shared contracts own Zod schemas. Server Components verify with getUser, never getSession identity. Token-hash email templates support cross-device confirmation/recovery without depending on the registering browser verifier. Google uses SDK PKCE cookies and a fixed callback. Return paths use an exact supported localized route allowlist with no arbitrary queries. POST origin must equal the configured application origin; no GET logout. Server responses preserve all SDK cookie writes even on errors, use no-store and no-referrer. Bootstrap failures redirect to a minimal account retry state with the valid session intact.

## Risks / Trade-offs

- Email-link scanners can consume single-use tokens: explain invalid/reused links and allow a new request.
- External Google credentials are unavailable: controlled callback/error tests prove application behavior; live Google remains explicitly unverified.
- Provider rate limits remain enforced: test-scoped unique users and sequential real local tests, never hidden retries or mocked security acceptance.
- JWT access tokens retain provider lifetime after logout: refresh/current cookie session is removed; authorization remains RLS/verified-provider owned.

## Migration Plan

No database migration. Apply local Auth redirect/template configuration using local stop/start without reset. Keep secrets in ignored environment only. No production deployment is included.
