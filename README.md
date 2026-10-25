# Dance Platform

Phase 1: guest-first Next.js foundation. English/Russian shell, public Playground catalog and clearly labeled Practice Timer/Login/Register placeholders. No authentication, persistence or timer engine.

## Local development

Node ^20.19.0 or >=22.12.0; pnpm 8.15.4.

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
```

Open http://localhost:3000 (/ redirects to /en). On Unix use pnpm instead of pnpm.cmd.

## Commands

Root dev/build/lint/typecheck/test/test:ci/e2e orchestrate the workspace. start/start:dev/start:local/build:release/test:e2e remain compatible aliases. preview starts the production build on 127.0.0.1:4310. pnpm --filter @dance/web dev/build also work independently. Use one package manager: pnpm.

Run pnpm verify for agents, workflow tests, lint/boundaries, types, formatting, Vitest/coverage, production build, browser tests and strict specs. Set PLAYWRIGHT_BROWSER_CHANNEL=msedge or chrome, or PLAYWRIGHT_BROWSER_EXECUTABLE_PATH. Browsers are never downloaded by project scripts.

Architecture: apps/web → packages/{ui,design-tokens,contracts}; app → shell/module APIs → shared. See docs/adr/0002-dance-platform-foundation.md and docs/web-platform/phase-1/phase-1-report.md.

## Агентный процесс (OpenCode, Claude Code и Codex)

Процесс одинаков во всех средах: explore → OpenSpec change → BDD → TDD → implementation → verification → review → acceptance → commit.
Канонические файлы лежат в `.opencode/`; `npm run agents:sync` генерирует `.claude/`, `.agents/skills` и `.codex/agents`. Claude skills копируются, agents/commands получают frontmatter, rules — условные `paths`. `CLAUDE.md` импортирует `AGENTS.md`; Codex читает корневой `AGENTS.md` напрямую.
Правила читаются по задаче: таблица в `AGENTS.md`; подробные справочники — `docs/agent-reference/`. Проверка синхронизации: `npm run agents:check`. Не подключайте весь каталог rules глобальным instructions glob: это отменит экономию контекста.
ESLint 8 вынесен в `.eslintrc.cjs` (прежний `react-app` baseline сохранён); identifier naming в TS проверяется предупреждениями, форматирование — неизменённым Prettier. Детали установки и границы проверок: [docs/STARTER-OPTIMIZATION.md](docs/STARTER-OPTIMIZATION.md).
Оркестратор — основная сессия: в OpenCode это агент `orchestrator`, в Claude Code — основная сессия (или `claude --agent orchestrator`).
Specialists только читают код и не вносят правок: `architect`, `test-designer`, `reviewer`.

### Codex

Распакуйте комплект в существующий проект с сохранением своих src/tests/openspec,
затем `npm run agents:sync` и `npm run agents:check`. Модель/provider/login
настраиваются вашим Codex-клиентом, не этим starter-kit. В новом CLI-сеансе
из корня проекта используйте `$team-change-plan`, `$team-change-apply`,
`$team-change-verify`, `$team-test-module` и другие `$team-*` skills вместо
OpenCode/Claude slash-команд. Дополнительные npm-пакеты для адаптации не нужны.

Подробности, mapping всех команд, проверки совместимости и ограничения permissions:
[docs/CODEX.md](docs/CODEX.md).
Это комплект окружения, не полная копия приложения: в исходном архиве нет
src/tests/openspec. Их не удалять и не заменять. Для пустого проекта сначала
подключить реальную OpenSpec-схему frontend-bdd-tdd и тестовую инфраструктуру.

### Команды

| Команда | Назначение |
|---|---|
| `/feature <описание>` | новая функциональность по полному процессу spec-bdd-tdd |
| `/bugfix <описание>` | исправление дефекта с регрессионным RED |
| `/change-plan <ticket> <описание>` | только OpenSpec artifacts и planning gate |
| `/change-apply <change>` | реализация по TDD-срезам |
| `/change-verify <change>` | verify, review, ready gate |
| `/change-archive <change>` | архивирование change и перенос specs |
| `/review [scope]` | независимый review по двум осям: spec и standards |
| `/commit <ticket>` | проверенный commit с Jira и OpenSpec (без push) |
| `/debug <симптом>` | диагностика через воспроизведение и гипотезы |
| `/refactor <scope>` | безопасный рефакторинг без изменения поведения |
| `/architecture-refactor plan\|apply\|verify\|status <change>` | структурная миграция с baseline/final evidence |
| `/test-module <module>` | тесты (unit, RTL, MSW, Playwright BDD) для существующего поведения без OpenSpec |
| `/tech-debt-audit <scope>` | аудит техдолга с доказательствами |
| `/opsx-explore`, `/opsx-propose`, `/opsx-apply`, `/opsx-update`, `/opsx-sync`, `/opsx-archive` | нативные OpenSpec workflow |

### Skills

| Skill | Когда загружается |
|---|---|
| `spec-bdd-tdd` | любое изменение поведения: OpenSpec, Gherkin, RED/GREEN/REFACTOR |
| `react-behavior` | обычные изменения компонентов, hooks и state |
| `playwright-bdd` | браузерные сценарии: навигация, focus, layout |
| `accessibility` | интерактивный UI, формы, диалоги, клавиатура |
| `react-best-practices` | измеренные проблемы производительности React |
| `web-performance` | Core Web Vitals, bundle, runtime |
| `systematic-debugging` | падения сборки или тестов, баги, flaky |
| `team-refactor-safely` | рефакторинг без изменения поведения |
| `architecture-refactor` | широкие структурные миграции (sub-apps, FSD) |
| `tech-debt-audit` | оценка и приоритизация техдолга |
| `commit-change` | оформление commit по запросу |
| `openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-update-change`, `openspec-sync-specs`, `openspec-archive-change` | шаги нативного OpenSpec |

### Пример

```text
/change-plan POR-1234 фильтр по статусу в списке заявок
/change-apply por-1234-status-filter
/change-verify por-1234-status-filter
/change-archive por-1234-status-filter
/commit POR-1234
```
