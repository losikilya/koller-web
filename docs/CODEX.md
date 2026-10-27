# Codex project workflow

This repository is a working Next.js monorepo. Do not unpack a starter over it, replace its source/specs, initialize another Git repository or reconfigure the client model/provider. Current setup: [README](../README.md); architecture: [project reference](agent-reference/project.md); delivery: [PROCESS](PROCESS.md).

## Entry points and generation

Codex reads root AGENTS.md. CLAUDE.md imports that entrypoint for Claude; OpenCode/Claude retain their existing workflows. .opencode is canonical. scripts/sync-claude.mjs and scripts/sync-codex.mjs generate .claude, .agents/skills and .codex/agents. Run pnpm agents:sync and pnpm agents:check after canonical edits. Generated files are adapters, not a second architecture authority. Preserve foreign/user-owned files; generators report stale generated files rather than deleting arbitrary content.

The project .codex/config.toml preserves specialist aliases and session model inheritance. It stores no credentials/provider override. Trust/login/model settings belong to the user's client; do not guess model IDs, add maxTurns or change global configuration.

## Team workflow mapping

Invoke team skills explicitly in chat, not in PowerShell. Existing slash names are workflow labels. Each adapter reads its canonical command instead of duplicating the process.

| OpenCode / Claude label | Codex                       |
| ----------------------- | --------------------------- |
| /architecture-refactor  | $team-architecture-refactor |
| /bugfix                 | $team-bugfix                |
| /change-apply           | $team-change-apply          |
| /change-archive         | $team-change-archive        |
| /change-plan            | $team-change-plan           |
| /change-verify          | $team-change-verify         |
| /commit                 | $team-commit                |
| /debug                  | $team-debug                 |
| /feature                | $team-feature               |
| /opsx-apply             | $team-opsx-apply            |
| /opsx-archive           | $team-opsx-archive          |
| /opsx-explore           | $team-opsx-explore          |
| /opsx-propose           | $team-opsx-propose          |
| /opsx-sync              | $team-opsx-sync             |
| /opsx-update            | $team-opsx-update           |
| /refactor               | $team-refactor              |
| /review                 | $team-review                |
| /tech-debt-audit        | $team-tech-debt-audit       |
| /test-module            | $team-test-module           |

Example tests-only request: $team-test-module apps/web/src/shared/i18n/routes.ts. It starts GREEN, uses tests/apps/web/shared/i18n/routes.test.ts, changes no production/specs/process docs and creates no OpenSpec artifacts. Report suspected defects; do not fix them under tests-only scope. Use @/ for application test imports and public package exports for package tests.

## Ownership, review and permissions

The main session is the sole writer. Specialists architect, reviewer and test_designer work sequentially, read-only, without recursive delegation. Codex shell is permitted only for read/search inspection in specialist adapters; no application execution, tests, package scripts, writes or network. Specialists inherit client permissions: a TOML role instruction is not a separate technical sandbox.

Give reviewers actual requirements, diff including untracked files and command results. They distinguish direct inspection from parent-run checks. If independent review is unavailable, report it pending rather than inventing PASS. Use at most two review passes and preserve OpenSpec commit metadata. No Jira ticket is required. Each commit, push or publication needs explicit authorization for that operation; existing consent covers only the current approved scope, never future operations.

## Verification

pnpm test:workflow covers sync resources, binary assets, CRLF/drift/stale adapters, behavior evidence and baseline/final scope guards. pnpm verify also runs source/test checks, production build and real browser BDD. Existing Playwright browser overrides remain available; no browser is downloaded automatically. Runtime client capabilities are verified by actual session support, not by parsing configuration alone.
