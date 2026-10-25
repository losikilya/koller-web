# Design

## Context

Button and Container exist; Card/Badge styling is application-local. Mobile Colors.ts and Button.tsx were read directly and agree with Phase 0 extraction. Sources: docs/web-platform/phase-0/02-design-system-extraction.md, 03-platform-architecture.md and Phase 1 reports. See proposal for scope.

## Decisions

- Keep raw values and semantic aliases in design-tokens. CSS variables cannot be media-query conditions: document breakpoint conventions and centralize responsive gutters in tokens.css. Preserve the existing 768px navigation threshold; 640/1024px container gutters remain web adaptations.
- Extend explicit @dance/ui exports. Static primitives remain server compatible; only Dialog/Tabs have client directives. No application imports, providers or global state. Native props preserve React 19 refs.
- Native dialog/showModal provides focus containment, inert background and Escape. Synchronize controlled open and restore focus/scroll on cleanup. A headless dependency is unnecessary for one simple modal; revisit only for richer composition.
- Tabs use local state only when uncontrolled; automatic synchronous selection, roving tabindex, disabled skip and horizontal arrows/Home/End. Native buttons preserve activation semantics.
- Storybook 10.6.3 @storybook/nextjs-vite metadata explicitly accepts installed Next 16.4.3, React 19.3.0 and Vite 7.3.6. Use minimal supported integration, no legacy addons or paid service. Stories stay outside production source, import public API, share tokens/system fonts. Verify pnpm 8 manual installation rather than changing manager for current CLI recommendations.
- Keep locale-aware app links; expose a shared button class helper for their visual states. Replace duplicated Card/Badge markup only where semantically appropriate.
- Hauora rights/glyphs remain unverified; preserve documented system font fallback. No copied font assets or invented extraction claims. Raw mobile palette/radii/motion and explicit web adaptations are documented separately.

## ADR impact

None. Read-only architect inspection confirms existing dependency directions and route ownership remain intact. No new ADR needed.

## Verification and migration

Establish full GREEN before production edits. New busy/error/dialog/tabs/feedback/examples get loadable test seams and recorded RED/GREEN/REFACTOR. Real browser checks validate modal focus and tabs through Storybook, plus existing localized routes and responsive shell. Run Storybook build and full pnpm verify sequentially, independent review, ready and native archive. Keep old archived history unchanged. Rollback consists of reverting this change's source/config, with no persisted data.

## Risks

Native dialog behavior cannot be proven in jsdom: real Edge checks are mandatory. Storybook package availability and framework compatibility require install/build verification. Manual screen-reader/physical-device checks are reported only if executed.
