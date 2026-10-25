# Frontend delivery contract

Shared by OpenCode, Claude Code and Codex. Reply in Russian; preserve Russian product text.
Dance Platform: pnpm/Turbo, Next.js App Router, React 19, TS 5.9, SCSS Modules; Vitest/RTL/MSW and Playwright BDD. Keep installed compatible versions. Alias @/ means apps/web/src/. Tests mirror source under tests/apps/web and tests/packages. Architecture: docs/adr/0002-dance-platform-foundation.md.

## Load only what the task needs

Read affected code/callers/tests first. Canonical rules are .opencode/rules; .claude/rules are generated adapters. OpenCode/Codex: explicitly read relevant rules below. Claude: paths load rules for matching files; explicitly read a rule when planning needs it before opening code. Codex does not interpret Claude paths as a loading policy.

| Concern | Read |
|---|---|
| Imports, module placement, architecture | architecture-fsd.md and relevant accepted docs/adr |
| Source naming/types/comments | naming-code-style.md |
| UI, browser/data handling, async behavior | frontend-quality.md |
| Tests or changed behavior | testing-integrity.md |
| Exploring/maintaining anchors | agent-context-anchors.md |

Rule paths are relative to .opencode/rules. Read docs/agent-reference/project.md only when touching HTTP/config, state, routing or styles. Use existing config/HTTP infrastructure; never hard-code endpoints or expose secrets in client env. Detailed anchors: docs/agent-reference/anchors.md only as needed.

## Process

- Behavior/contract changes require OpenSpec + executable BDD + recorded RED/GREEN/REFACTOR. Load spec-bdd-tdd; read docs/PROCESS.md for the active phase. Flow: explore → plan → BDD → TDD → implement → verify → review → acceptance → commit.
- /test-module adds tests for existing behavior, starts GREEN and does not edit production/specs or create OpenSpec artifacts, evidence or process docs. Do not load spec-bdd-tdd for it. Report defects/spec conflicts; fixes use /bugfix.
- In a behavior change, existing regression guards may use an explicit baseline; new behavior still needs RED. Never fabricate evidence or count setup failure as RED.
- workflow check precedes implementation; workflow ready and verify precede archive. Never rewrite archived history. Docs/config-only work identifies verification and non-applicability, with human review; do not manufacture RED or bypass the behavior gate.

## Ownership and verification

- Main orchestrator is the only writer. Specialists are read-only and sequential, without recursive delegation. Architect handles boundary/dependency decisions; test-designer handles ambiguous scenarios; reviewer checks requirements and engineering independently, at most two passes.
- Codex: the main session orchestrates. Use $team-<command> skills for team workflows (e.g. $team-test-module); original /command names remain workflow labels. Skills live in .agents/skills; custom specialists in .codex/agents. Codex names: architect, reviewer, test_designer; built-in explorer for exploration. If independent review is unavailable, report it pending. Specialist read-only behavior is an instruction constraint, not a separate Codex sandbox; they inherit parent permissions.
- Use the session model; do not guess corporate model IDs or limits. Existing user authorization carries forward; clarify only choices that change scope/contracts.
- Commands: npm start; npm run typecheck/lint/test:e2e/build/verify; npm test. Typecheck/lint: zero errors; existing import-x/no-cycle warnings must not grow. Fix cycles; do not suppress them in lint/build config.
- Focused checks during implementation; required full gate on a completed change. Rerun after material fixes. One test process at a time; no tests after every edit hook, unrelated autofixes or dependency upgrades.
- Strict TS: type-only imports, _ for intentionally unused parameters, no enum/namespace/parameter properties (erasableSyntaxOnly). Formatting/naming mechanics belong to Prettier/ESLint.
- No commit, push or publication unless requested. /commit permits the commit workflow only, not push.

## Context budget

- Start with paths/symbols/anchors in the affected area. Read relevant ranges and one nearby example; expand for unresolved dependencies. Do not dump all memory, archives, rules or skills.
- Keep one coherent task/change per session where practical. For handoff record only decisions, changed paths, check results/exit codes and next action. For tests-only work reply with the handoff; do not create documentation.
- A stopped/incomplete change stays incomplete. Real checks establish completion, not checklists/model verdicts/turn limits. Preserve exit codes when truncating logs.
- .opencode is canonical. After edits run npm run agents:sync and npm run agents:check for both Claude and Codex adapters. Do not import all rules/reference docs through @ or a global instructions glob. Setup/command mapping: docs/CODEX.md, only when needed.
