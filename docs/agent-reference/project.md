# Dance Platform project reference

## Runtime and routing

pnpm/Turbo workspace; Next App Router in apps/web/src/app. en/ru locale prefixes; / redirects deterministically to /en; unknown locale/path returns 404. Use shared/i18n/navigation for localized links and module namespaces for resources. @/ means apps/web/src.

## HTTP, configuration and state

Phase 1 has no backend, endpoint configuration, authentication, persistence or global state. Future HTTP configuration must be validated server-side; public client environment values cannot hold secrets. Banking proxies and state adapters do not apply to this empty starter checkout.

## Styles

SCSS Modules, semantic CSS properties from @dance/design-tokens/tokens.css, explicitly imported in app/globals.scss. Provisional web spacing/breakpoints and system fonts are documented in phase-1/workspace-architecture.md. Semantic HTML, keyboard operation and visible focus are required.

## Checks

Root pnpm scripts retain workflow, tdd, spec, verify, agents:sync/check and test:e2e. npm run remains a compatible script invocation, but installation uses pnpm only. E2E serves Next production on 127.0.0.1:4310 with existing browser overrides, no automatic browser download.
