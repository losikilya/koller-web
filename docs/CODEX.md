# Codex: установка и переключение среды

## Что переносить

Комплект рассчитан на существующий проект из присланного starter_17102026.zip.
В него уже включена предыдущая оптимизация anchors/rules/ESLint.
Для обновления используйте приложенный patch, либо переносите файлы из полного
комплекта с проверкой diff. Не заменяйте свои src/tests/openspec, env и настройки
провайдера. В присланном исходнике этих source/spec-каталогов нет: этот архив
не является самостоятельно запускаемым приложением или OpenSpec schema bundle.
Не удаляйте установленную схему openspec/schemas/frontend-bdd-tdd.

| Файл/папка | Назначение |
|---|---|
| AGENTS.md | Общий вход для трёх сред; Codex читает напрямую |
| .opencode | Канонические инструкции, skills, команды и роли |
| .claude | Существующие адаптеры Claude, сохраняются |
| .agents/skills | Codex skills и явные team-workflows |
| .codex/agents | TOML-адаптеры architect, reviewer, test_designer |
| .codex/config.toml | Project config: включает specialists, без model/provider/auth |
| scripts/sync-codex.mjs | Генерация и проверка Codex adapters |
| package.json | Общие agents:sync/check и тест генератора |

Если свои package.json или .codex/config.toml уже изменены, объединить изменения,
а не перезаписывать. Dependencies/lock не меняются. Из package.json нужны scripts:

```json
{
  "agents:sync": "node scripts/sync-claude.mjs && node scripts/sync-codex.mjs",
  "agents:check": "node scripts/sync-claude.mjs --check && node scripts/sync-codex.mjs --check",
  "test:workflow": "node --test scripts/workflow.test.mjs scripts/starter-config.test.mjs scripts/sync-claude.test.mjs scripts/sync-codex.test.mjs"
}
```

Если предыдущая оптимизация не установлена, также удалить eslintConfig из
package.json и перенести .eslintrc.cjs. Prettier и eslint toolchain сохранены.

```sh
npm run agents:sync
npm run agents:check
node --test scripts/sync-codex.test.mjs scripts/sync-claude.test.mjs
```

В полном проекте дополнительно выполнить test:workflow, lint и typecheck.
Не скачивать Chromium: сохранён ваш Playwright browser override.

## Как запускать

Используйте актуальный Codex CLI/IDE, запущенный в корне проекта. CLI:

```sh
codex --version
codex
```

Codex должен доверять проекту, чтобы применить project config. Корпоративные
ограничения имеют приоритет. Не менять модель на Kimi в этом kit: provider/model
и доступ выбираются в самом клиенте. Работа через gateway требует поддержки
протокола именно Codex, а не только наличия модели в списке LiteLLM.

Вводите следующие примеры в диалог Codex, не в PowerShell:

```text
$team-change-plan POR-1234 прочитай ticket.md и подготовь план
$team-change-apply por-1234-status-filter
$team-change-verify por-1234-status-filter
$team-change-archive por-1234-status-filter
$team-commit POR-1234
```

Для существующего непокрытого кода:

```text
$team-test-module src/utils/cameras.ts
Покрой существующее поведение. Production-код и specs не менять.
```

Это characterization GREEN; команда не создаёт OpenSpec/change-plan/evidence/docs
и не запускает workflow/tdd. Подозреваемые баги сообщает отдельно.

## Соответствие команд

| OpenCode / Claude | Codex |
|---|---|
| /feature | $team-feature |
| /bugfix | $team-bugfix |
| /change-plan | $team-change-plan |
| /change-apply | $team-change-apply |
| /change-verify | $team-change-verify |
| /change-archive | $team-change-archive |
| /test-module | $team-test-module |
| /review | $team-review |
| /refactor | $team-refactor |
| /architecture-refactor | $team-architecture-refactor |
| /debug | $team-debug |
| /tech-debt-audit | $team-tech-debt-audit |
| /commit | $team-commit |
| /opsx-explore, /opsx-propose, /opsx-apply | $team-opsx-explore, $team-opsx-propose, $team-opsx-apply |
| /opsx-update, /opsx-sync, /opsx-archive | $team-opsx-update, $team-opsx-sync, $team-opsx-archive |

Каждый team-workflow — небольшой adapter, читающий существующий canonical command,
без второй копии его процесса. Invocation policy запрещает неявный trigger этих
workflow adapters: вызывайте их явно. Процедурные skills (accessibility,
spec-bdd-tdd и др.) сохраняют исходное содержание. Если одноимённый global skill
тоже установлен, не считайте их автоматически объединёнными: проверьте путь.

## Агенты, rules и permissions

Главная сессия — единственный writer/orchestrator; отдельного child-orchestrator нет.
Специалисты вызываются последовательно: architect, test_designer, reviewer;
explorer — встроенный. Три открытых child threads в config не означают разрешение
параллельной записи. Нет жёстко заданных model/reasoning: наследуются от сессии.

У Codex rules не являются аналогом .claude/rules с paths. Корневой AGENTS.md
указывает читать нужные .opencode/rules по задаче, без глобального импорта.
.codex/rules не создаётся: этот путь связан с execution policies, а не Markdown
код-стайлом. Обёртка не превращает instructions в OS sandbox.

Специалисты Codex наследуют permissions родителя. TOML не пытается задать им
sandbox_mode/approval_policy, которые не создают отдельную sandbox-политику роли.
Read-only здесь задаётся инструкцией. В Codex CLI чтение часто идёт через shell:
адаптер допускает только поиск/чтение, запрещая edit, запуск тестов/кода и network.
Проверки выполняет writer; reviewer честно отделяет их от собственной инспекции.
Если требуется технически read-only review, используйте отдельную CLI-сессию
с read-only sandbox и передайте diff/контракт, либо управляемую политику платформы.

Если custom agents недоступны в версии клиента или запрещены администратором,
не подделывать независимый PASS: оставить review pending и явно сообщить об этом.
Не устанавливать выдуманный maxTurns/steps для Codex и не задавать sandbox роли.

## Проверка и границы

Генератор проверяется Node-тестами: inheritance, явные workflows, перенос resources,
побайтовые binary assets, CRLF, drift, stale generated roles. Чужие файлы не удаляет.
После удаления canonical skill его старую Codex-копию нужно удалить вручную;
генератор не считает любой пользовательский skill своей собственностью.

Валидировать TOML/YAML недостаточно для проверки runtime поведения. В этой сборке
проверены генерация, синтаксис и consistency; реальная модельная сессия вашего
Codex/provider, source lint/typecheck/build и BDD/E2E здесь не запускались.

Результат сборки: 19 Node tests workflow/architecture/sync плюс 2 доступных
starter-config tests — PASS; agents:check — 45 Claude и 58 Codex файлов без drift.
Валидны project TOML, 3 role TOML, frontmatter 36 skills и 19 invocation policies.
Проверка starter-config, требующая src, выполняется после переноса в полный проект.

Форматы сверены с официальной документацией на 2026-10-20:

- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/subagents
- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/config-reference
