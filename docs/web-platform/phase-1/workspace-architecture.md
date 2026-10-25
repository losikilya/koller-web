# Workspace architecture

```text
apps/web/src/
  app/[locale]/                 Next route adapters and metadata
  shell/                       Home/identity placeholders and navigation composition
  modules/playground/          Public catalog and Practice Timer placeholder
  shared/i18n/                 Locale configuration, navigation, request resources
  shared/styles/               Shared page composition styles
packages/
  ui/src/                      Container and native Button, explicit SCSS
  design-tokens/src/           Semantic CSS custom properties
  contracts/src/               Framework-independent PlaygroundAppId
tests/
  apps/web/                    Mirrored web tests
  packages/ui/                 Mirrored primitive tests
  bdd/foundation/              Executable control scenarios
  e2e/foundation/              Browser scenarios/specs
openspec/                      Native schema, active change and recorded evidence
```

Dependency graph: web → ui/design-tokens/contracts; ui → design-tokens. app → shell/public Playground API → shared/packages. Contracts has no runtime dependencies. No packages import apps. No empty future modules or speculative shared-kernel/config packages. ADR-0002 supersedes the banking profile; Phase 0 ADRs remain unchanged. No nested Git repository was created; the supplied checkout itself has no .git.

TypeScript AST checks resolve local, alias and explicit workspace imports, re-exports and literal dynamic imports; reject package/app reversals, private module imports, upward layer imports and cycles. Locale resources use explicit en/ru dynamic imports after locale validation; nonliteral imports are rejected. ESLint import-x/no-cycle remains enabled. CSS imports are included in boundary analysis. Negative fixtures verify rejected edges/cycles.

Server Components render all page content, metadata and navigation. Only MobileNavigation owns client state; NextIntlClientProvider supplies locale context. Typed navigation is composed once and reused for desktop/compact menus. Escape restores focus; skip link targets focusable main. Locale links preserve each supported pathname. / redirects to /en regardless of Accept-Language/cookies; unknown locale and unknown route are 404. Translation namespaces: shell, home, identity, playground, practiceTimer. No external translation service.

## Design provenance and provisional values

Colors derive from Phase 0 extraction: #0b0c0e canvas, #13131c raised, #0e1417 card, #4cd6ff cyan, #ecb1ff violet, white text. Cyan actions use black text. Muted text #b4b5c8 is a provisional higher-contrast adaptation of the mobile palette. Decorative borders are separate from control boundaries. System fonts support Cyrillic without unverified font redistribution. No mobile asset was copied.

Spacing, radii, shadow and 1200px maximum content width implement the Phase 0 proposed web adaptation. CSS custom properties isolate replaceable values. Media queries are explicit CSS build-time thresholds: 640px gutters, 768px navigation and 1024px wide gutters. The 768px navigation threshold is a provisional fit choice for bilingual header content. CSS custom properties cannot be used as native media query conditions. Full typography/font licensing, design-system catalog, theme variants and final brand remain later work.

Root scripts orchestrate Turbo build/dev/lint/typecheck. Dev is persistent and uncached; build declares upstream dependencies and .next outputs excluding cache. CSS-only tokens have no artificial TypeScript task. Unit tests stay at root to preserve the existing TDD runner. Web/UI expose focused standalone test commands. Browser port and overrides are retained; Vite remains only as Vitest tooling.
