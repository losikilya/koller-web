# ADR-0002: Dance Platform workspace and modular monolith

Status: Accepted

Supersedes: ADR-0001 for this Dance Platform checkout. Phase 0 ADR-001 through ADR-014 remain unchanged.

## Context

The starter contains banking engineering references but no banking source. The accepted brief authorizes a separate Next.js workspace. Flat FSD would compete with the verified Phase 0 module boundaries.

## Decision

apps/web/src/app owns framework routing; shell composes pages/navigation; modules/playground exposes its public catalog and placeholder; shared contains domain-agnostic app utilities. External consumers use explicit index exports. Direction: app → shell/module API → shared/packages. Modules never import shell or unrelated private modules.

Create only ui, design-tokens and contracts packages. UI depends on tokens; contracts is framework independent; packages never import apps. Defer shared-kernel/config until meaningful consumers exist. Server Components are default; compact navigation is the only stateful client boundary.

Use pnpm/Turbo; retain root engineering entrypoints, mirrored tests, strict types and existing test tools. Enforce relative/alias/re-export/dynamic boundaries and cycles. No deployment/auth/timer engine.

## Consequences

Update architecture profile/project reference and regenerate adapters. Preserve previous ADR as historical context. System fonts replace unverified mobile files. Read-only architect consultation completed; main session owns implementation and checks.
