# Dance Platform architecture and commands

Current authority: [ADR-0002](../adr/0002-dance-platform-foundation.md), accepted [Phase 0 decisions](../web-platform/phase-0/04-architecture-decision-records.md), and [product specification](../../openspec/specs/platform-shell/spec.md). Historical reports describe their own phase, not current setup.

## Next.js runtime

Next.js App Router lives in apps/web/src/app. Routes/layouts are thin framework adapters; shell owns composition, modules own domain UI, shared owns domain-agnostic utilities. Server Components are default. Add a Client Component only for event handlers, hooks or browser APIs; keep its imported graph free of server-only code/secrets. Browser globals are not available during server rendering. Keep server-only dependencies behind server boundaries; public environment variables cannot contain secrets. Do not introduce provider clients, auth/state/persistence or endpoints during foundation cleanup.

Use route layouts for composition and framework loading/error boundaries when real async/error states require them; an interactive error boundary is client code. Do not add speculative boundaries to static placeholders. Metadata is localized through Next metadata adapters. en/ru prefixes are mandatory, / deterministically redirects to /en, unknown locale/path is 404. Use shared/i18n/navigation for locale-aware links; messages stay in module namespaces. React Router does not own application routing. @/ means apps/web/src.

## Workspace boundaries

app → shell/public module APIs → shared/packages. Modules expose explicit index exports, never unrelated private paths. Packages cannot import apps; contracts cannot depend on React, Next.js, Expo/React Native or browser code. UI uses explicit @dance/ui exports and application-independent tokens. Workspace consumers declare workspace:\* references; no deep package imports, wildcard exports or circular dependencies. Run pnpm boundaries plus existing cycle lint.

## Styles and testing

SCSS Modules and semantic custom properties from @dance/design-tokens/tokens.css, explicitly imported in app/globals.scss. Token provenance/provisional values: [workspace architecture](../web-platform/phase-1/workspace-architecture.md). Preserve semantic HTML, keyboard behavior and focus.

Tests stay in root tests/ by established convention: apps/web/src → tests/apps/web, packages/<name>/src → tests/packages/<name>. Use unit tests for meaningful logic/controls, integration tests for boundaries, and Playwright BDD for real routing/focus/layout/browser behavior. Do not manufacture unit tests for static route composition. Root Vitest configuration owns jsdom, aliases, sequential execution and coverage; browser scenarios live in tests/e2e. MSW is reserved for actual HTTP boundaries when those exist.

## Commands

Install only with pnpm 8.15.4; Node ^20.19.0 or >=22.12.0. Windows PowerShell can use pnpm.cmd without changing execution policy. Root dev/build/lint/typecheck use Turbo; test/test:ci use the shared Vitest runner so existing TDD evidence remains compatible. Package-level commands: pnpm --filter @dance/web dev/build/test, pnpm --filter @dance/ui test. CSS-only design-tokens has a formatting lint task and no TypeScript config/task.

pnpm verify runs the complete existing quality gate. pnpm preview serves production Next on 127.0.0.1:4310; build before E2E. PLAYWRIGHT_BROWSER_EXECUTABLE_PATH and PLAYWRIGHT_BROWSER_CHANNEL=chrome|msedge remain mutually exclusive overrides. Project scripts never download browsers. Vite/plugin-react serve Vitest only, not the application. CRA ESLint remains the compatible lint baseline; its name is not a runtime architecture claim.
