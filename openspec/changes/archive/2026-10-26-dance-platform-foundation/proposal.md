# Proposal

## Why

The starter contains engineering workflows but no application. Establish a runnable guest-first Dance Platform foundation using the accepted Phase 0 architecture.

## What Changes

- FR-001: Visitors can navigate localized Home, Playground, Practice Timer, Login and Register placeholders without authentication.
- FR-002: English is default, Russian navigation preserves the supported route, unsupported locales return 404, metadata is localized.
- FR-003: Responsive navigation supports keyboard disclosure, Escape, visible focus and a skip link.
- FR-004: Shared UI preserves semantic native control behavior.
- pnpm/Turbo workspace, tokens, explicit packages, strict types, import boundaries and CI preserve starter tooling.

## Capabilities

### New Capabilities

- platform-shell: Localized guest routes, accessible navigation and minimal shared controls.

### Modified Capabilities

None: no existing application or stable specifications were supplied.

## Impact

apps/web, packages/ui, packages/design-tokens, packages/contracts, root configuration, tests, CI, documentation. Banking runtime dependencies have no source consumers; preserve a manifest inventory and remove unused runtime tooling. Agent workflows remain at their existing paths. No authentication, persistence, timer engine, mobile edits, deployment or Git commit.
