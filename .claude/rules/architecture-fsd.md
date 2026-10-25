---
paths:
  - "src/**/*"
  - "apps/*/src/**/*"
  - "packages/*/src/**/*"
  - "docs/adr/**/*.md"
  - "openspec/changes/**/design.md"
---
# Architecture profile: Dance Platform modular monolith

Accepted in docs/adr/0002-dance-platform-foundation.md, superseding the banking profile for this checkout. Phase 0 decisions remain in docs/web-platform/phase-0.

- apps/web/src/app owns Next.js routes, layouts and framework adapters. Server Components by default.
- app composes shell/public module APIs; shell composes modules/shared/packages; modules use shared/packages. Lower layers never import app or shell.
- Modules live in src/modules/<domain>. External consumers enter only via explicit named index.ts exports. Internal imports are direct, never their own barrel. No unrelated module or micro-app private imports.
- shared holds domain-agnostic application utilities, never domain logic promoted to bypass boundaries.
- packages/ui depends on design-tokens; contracts is framework independent, without React/Next/Expo/browser APIs. Packages never import apps. Explicit exports only; no cycles.
- Create only meaningful packages/segments. Identity/Profile and shared-kernel/config remain deferred.
- @/ resolves to apps/web/src. Tests mirror source in tests/apps/web and tests/packages. Browser journeys remain in root tests/e2e.
- Boundary/public API/routing ownership changes require architect review and durable decisions require a superseding ADR. Run pnpm boundaries and cycle lint; never suppress cycles.
