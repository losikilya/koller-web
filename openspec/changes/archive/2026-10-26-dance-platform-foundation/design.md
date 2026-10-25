# Design

## Context

The starter has no source/tests/OpenSpec schema/Git directory. See proposal.md. Read and copy Phase 0 documents without changing the mobile checkout.

## Decisions

Next App Router adapters compose server-rendered shell/module pages. Only mobile navigation needs client state. next-intl provides locale routing/navigation/messages, with deterministic English root and 404 validation. Use namespaces shell, home, identity, playground and practiceTimer. One route adapter per supported path avoids catch-all rendering.

Use pnpm 8.15.4 already available, Turbo 2.11.10, Next 16.4.3, next-intl 4.14.9 and existing React/TypeScript/testing majors. Vitest remains a root runner because the established TDD wrapper uses it. Preserve aliases and mirrored tests under tests/apps/web and tests/packages. Keep workflow scripts; expand production-path recognition to workspaces. No thresholds are reduced.

Superseding local ADR-0002 adopts Phase 0 modular monolith: app → shell/public module API → shared/packages. Packages cannot import applications. contracts is framework independent. Enforce resolved relative, alias, static and dynamic import boundaries and cycles through TypeScript AST, plus ESLint cycle checks. Architect consultation completed read-only.

## Risks / Trade-offs

Font rights/Cyrillic unknown → system font; no copied assets. Extracted dark/cyan/violet palette, proposed web spacing/radius/breakpoints isolated in tokens. No Git baseline → no fabricated clean baseline; all new behavior uses real RED. Existing schema missing → fork native spec-driven schema and add required BDD/test-plan artifacts, retaining native CLI.

## Migration Plan

Inventory original manifest; install workspace dependencies; replace only empty scaffold entry points after checking references. Preserve agent directories and regenerate adapters from canonical rules. Verify install, unit/BDD, boundaries, formatting, lint, types, coverage, production build and real browser flows; independent reviewer checks the final result. No deployment or commit.

## Deferred Questions

Final brand, font rights and full device/screen-reader matrix remain product/design release work. Hosting, provider region, authentication and timer semantics belong to subsequent phases.
