# Dance Platform

A guest-first foundation for dance practice, with English/Russian navigation. Phase 1 provides Home, Playground, Practice Timer, Login and Register placeholders. Authentication, timer engine and persistence belong to later phases.

Next.js 16.4.3 App Router · React 19.3 · TypeScript 5.9 · next-intl 4.14.9 · SCSS Modules/CSS variables · pnpm/Turbo · Vitest/RTL/Playwright BDD.

## Setup

Node ^20.19.0 or >=22.12.0 and pnpm 8.15.4. Use the checked-in pnpm-lock.yaml; do not install workspace dependencies with npm/yarn. No backend or environment file is required for Phase 1.

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
```

Open http://localhost:3000. / redirects to /en; /ru provides Russian. On Unix use pnpm. Windows .cmd avoids PowerShell's script execution-policy restriction.

## Workspace and commands

apps/web owns the Next application; packages/ui, design-tokens and contracts expose explicit public exports. Tests live in root tests/apps/web, tests/packages, tests/bdd and tests/e2e. @/ resolves to apps/web/src. See the [architecture reference](docs/agent-reference/project.md) for server/client and dependency boundaries.

| Command                                                    | Purpose                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| pnpm dev / pnpm build                                      | Turbo application development / production build           |
| pnpm preview                                               | Production server at 127.0.0.1:4310 after build            |
| pnpm lint / pnpm boundaries / pnpm typecheck / pnpm format | Lint, import graph, strict types, formatting               |
| pnpm test / pnpm test:unit / pnpm test:bdd                 | Shared Vitest suite / unit subset / executable control BDD |
| pnpm test:ci                                               | Coverage and JUnit with existing conventions               |
| pnpm e2e                                                   | Playwright BDD and browser specs against production        |
| pnpm test:workflow                                         | Agent synchronization and workflow guard regression tests  |
| pnpm verify                                                | Full gate, including build and browser tests               |
| pnpm spec / pnpm workflow / pnpm tdd                       | Existing OpenSpec CLI and behavior gates                   |
| pnpm agents:sync / pnpm agents:check                       | Generate/check Claude and Codex adapters                   |

Package commands work through pnpm --filter @dance/web dev/build/test and pnpm --filter @dance/ui test. start/start:dev/start:local/build:release/test:e2e remain compatible aliases. Root scripts coordinate tasks; package scripts own their local tooling.

For browser tests set one installed-browser override: PLAYWRIGHT_BROWSER_CHANNEL=chrome|msedge or PLAYWRIGHT_BROWSER_EXECUTABLE_PATH. Example PowerShell: $env:PLAYWRIGHT_BROWSER_CHANNEL='msedge'; pnpm.cmd e2e. Project scripts do not download browsers.

## Engineering workflow

[AGENTS.md](AGENTS.md) is the shared entrypoint; [PROCESS](docs/PROCESS.md) defines behavior changes, tests-only work, safe refactoring and scoped maintenance. OpenSpec → executable BDD → recorded RED/GREEN/REFACTOR → verification → independent review remains mandatory for product behavior changes. Every commit requires an explicit user request, current verification/review and OpenSpec metadata; no Jira ticket is required. Pushing requires separate explicit authorization, and future commits or pushes always require fresh consent.

.opencode is canonical. Existing generators maintain .claude rules/commands/skills, .agents/skills and .codex/agents. Edit canonical files and run agents:sync/check. Main session is sole writer; architect, test_designer and reviewer are sequential/read-only. [Codex mapping and permissions](docs/CODEX.md) describe $team-\* invocations without model/provider overrides.

Procedural skills remain available: accessibility, commit-change, playwright-bdd, react-best-practices, spec-bdd-tdd, systematic-debugging, team-refactor-safely, tech-debt-audit and web-performance. Generic skills remain framework-independent; Next-specific guidance links to the architecture reference.

| Workflow label         | Codex invocation            |
| ---------------------- | --------------------------- |
| /architecture-refactor | $team-architecture-refactor |
| /bugfix                | $team-bugfix                |
| /change-apply          | $team-change-apply          |
| /change-archive        | $team-change-archive        |
| /change-plan           | $team-change-plan           |
| /change-verify         | $team-change-verify         |
| /commit                | $team-commit                |
| /debug                 | $team-debug                 |
| /feature               | $team-feature               |
| /opsx-apply            | $team-opsx-apply            |
| /opsx-archive          | $team-opsx-archive          |
| /opsx-explore          | $team-opsx-explore          |
| /opsx-propose          | $team-opsx-propose          |
| /opsx-sync             | $team-opsx-sync             |
| /opsx-update           | $team-opsx-update           |
| /refactor              | $team-refactor              |
| /review                | $team-review                |
| /tech-debt-audit       | $team-tech-debt-audit       |
| /test-module           | $team-test-module           |

## Architecture and history

- [Accepted Phase 0 architecture](docs/web-platform/phase-0/03-platform-architecture.md) and [ADRs](docs/web-platform/phase-0/04-architecture-decision-records.md).
- [Current local ADR](docs/adr/0002-dance-platform-foundation.md), [Phase 1 report](docs/web-platform/phase-1/phase-1-report.md) and [source inventory](docs/web-platform/phase-1/source-inventory.md).
- [Post-Phase 1 cleanup](docs/web-platform/phase-1/post-phase-1-cleanup.md).

Vite is retained for Vitest; eslint-config-react-app preserves lint rules. Neither supplies application routing or an SPA bootstrap. Phase 0 and archived changes are historical and are not rewritten to match current setup.
