# Accepted Architecture Decision Records

All fourteen decisions are **Accepted**, supplied by the product brief. They apply to the future platform, not a retrofit of this mobile repository. A change requires a new ADR explicitly superseding the affected decision. Implementation refinements elsewhere are proposals, not replacement ADRs.

| ID | Accepted decision | Rationale / consequence | Implementation verification |
| --- | --- | --- | --- |
| ADR-001 | Next.js, React, TypeScript; SSR public pages where useful, interactive Playground client-side | SEO and interaction have separate rendering needs | Server public routes and client timer boundary build successfully |
| ADR-002 | Separate pnpm workspaces + Turborepo monorepo with apps/web, ui, design-tokens, contracts, shared-kernel, config, migrations, architecture/ADR docs, e2e | Preserve mobile independence; packages only when justified | New repo scaffolding only in Phase 1; no Expo relocation |
| ADR-003 | Supabase Auth + PostgreSQL; Next.js thin BFF; no initial separate NestJS | Managed identity and focused transport minimize initial operational work | Provider auth, DB access control and isolated transport use cases |
| ADR-004 | Modular Monolith; controlled module interfaces; no deep imports/private-store sharing; no Module Federation | Boundaries without premature deployment complexity | Automated import-boundary checks pass |
| ADR-005 | Immutable UUID UserId; separate auth, profile and participant; usernames not relational IDs | Rename-safe identity and optional participant accounts | UUID FKs; participant links optional and explicit |
| ADR-006 | Preserve offline mobile SQLite, LAN sync, Host authority and event sourcing | Local events must survive cloud absence | No mobile changes now; later outage acceptance tests |
| ADR-007 | Enable future route-based extraction; no premature microfrontends | Extraction based on real ownership/deployment need | Explicit route/app IDs and interfaces; one initial web deployment |
| ADR-008 | NestJS optional; public contracts and server use cases independent of Next.js | Future transport replacement without domain rewrite | No Next.js imports in use-case/core/contract boundaries |
| ADR-009 | Future OpenSpec + BDD + TDD mandatory; ADRs for architectural change | Reviewable acceptance before implementation | Approved specs, scenarios and red/green tests in future repo |
| ADR-010 | Small settings/presets may use validated, versioned, owned and bounded JSONB; complex domains relational | Flexibility without unbounded schemaless data | Atomic quota enforcement, payload validation and migrations |
| ADR-011 | English + Russian; English default; locale-aware routes and module namespaces; evaluate next-intl in Phase 1 | Consistent internationalization | /en and /ru routes, fallback and locale resource tests |
| ADR-012 | public/private; discoverable boolean; showActivity reserved; private and not discoverable by default; server/database privacy | Prevent accidental publication; direct public non-discoverable URL allowed | Anonymous/non-owner privacy and discoverability DB tests |
| ADR-013 | Guest-first free tools; auth adds cross-device saving; core functions ungated | Immediate utility and optional account value | Anonymous start/pause/reset/local presets work |
| ADR-014 | Practice Timer first; independent of shell and unrelated domains | Focused useful first app | Pure engine tests and no battle imports |

## Explicit refinements proposed for implementation review

Owner-only profile tables plus narrowly scoped public projection functions; UUID canonical profile URLs; optimistic preset revisions; optional guest import rather than automatic merge; no running-session persistence across reload; zero rest allowed and no final rest; bounded configurable payload quotas. These fill unspecified details without changing accepted decisions. They must be captured in OpenSpec or an additional ADR where impact justifies one.

Unknowns requiring a decision before relevant implementation: framework/provider versions, region, email sender, deployment origin, font rights/Cyrillic support and legal retention requirements. A public username URL can be added later as an alias; it never replaces UUID identity.
