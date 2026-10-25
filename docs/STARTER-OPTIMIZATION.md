> Historical starter-kit report (pre-Dance Platform). The original report below is retained as history, not current setup instructions. Use [README](../README.md), [PROCESS](PROCESS.md), [CODEX](CODEX.md) and the [project reference](agent-reference/project.md) for the working Next.js workspace.

# Обновление starter-kit: контекст и ESLint

## Установка

Эта оптимизация включена в полный комплект трёх сред. Исходный patch от 17 октября
содержал только новые/изменённые файлы; текущий полный архив содержит весь доступный
starter-kit без приложения, secrets и node_modules. Установка Codex: docs/CODEX.md.
Переносите файлы в корень того же проекта с проверкой diff.
`package.json` основан на присланной версии: при новых локальных изменениях
перенесите только удаление `eslintConfig` и добавление
`scripts/sync-claude.test.mjs` в script `test:workflow`. Codex добавляет также
sync-codex и обновляет agents:sync/check; точные scripts приведены в docs/CODEX.md.

Новые пакеты не требуются; dependencies и lock-файл не менялись.
Prettier, TS, Vite, Vitest, Playwright и тестовые workflow gates не менялись.
Не запускать массовый `--fix` или переименование legacy-кода.

```sh
npm run agents:sync
npm run agents:check
node --test scripts/sync-claude.test.mjs
npm run test:workflow
npm run lint
npm run typecheck
```

Последние три команды выполнять в полном репозитории с установленными пакетами.
В присланном архиве нет src/tests и openspec; это не полный runtime проекта.

## Что изменено

- `.eslintrc.cjs`: ESLint 8 legacy config с прежними react-app/react-app/jest,
  import-x resolver и no-cycle warning. Четыре одинаковых override удалены.
- Naming: TypeScript type/class/interface PascalCase, запрет I-prefix у interfaces;
  переменные camelCase/PascalCase (React), const также UPPER_CASE; функции и
  параметры camelCase/PascalCase, разрешён `_`. Это предупреждения, не autofix.
- Не проверяются identifier naming в JS, API/DTO properties и imported bindings;
  destructuring сохраняет внешние имена. Нельзя надёжно определить по синтаксису,
  что любая const — смысловая константа или любая PascalCase variable — компонент:
  эти различия остаются в rule/review.
- File/folder/SCSS naming, predicate/callback semantics остаются в коротком rule.
  Stylelint и file-naming plugins не добавлены. Строгость TS обеспечивает tsconfig.
- Anchors: короткий rule плюс справочник `docs/agent-reference/anchors.md`.
- Интеграционные HTTP/state/router/style сведения перенесены из AGENTS в
  `docs/agent-reference/project.md`; поведение и ограничения не отменены.
- AGENTS задаёт маршрут чтения вместо требования загрузить все rules.
- Agents ссылаются на владельца правила; reviewer возвращает находки и ограничения,
  без большого пересказа кода. Его read-only permissions и verdict policy сохранены.
- `/test-module`, skills, commands, TDD/baseline scripts не изменялись.

## Path scopes

OpenCode: `.opencode/rules` не получает выдуманный paths API. AGENTS требует читать
нужный rule по задаче. Существующий глобальный instructions glob
`.opencode/rules/*.md`, если он настроен отдельно, следует убрать вручную;
сначала проверить project/global OpenCode config. В архиве их нет: чужие настройки
не перезаписываются и новый opencode.json не создаётся.

Claude: `scripts/sync-claude.mjs::RULE_PATHS` добавляет paths frontmatter к копиям.
Редактировать canonical rule, затем запускать sync. Claude rule body совпадает с
OpenCode; skills остаются побайтовыми копиями после нормализации EOL.

| Rule | Когда применяется Claude paths |
|---|---|
| anchors | src, tests, scripts |
| architecture | src, docs/adr, change design.md |
| frontend quality | JS/TS/JSX/TSX/SCSS/CSS в src |
| naming | source JS/TS/styles и тестовый JS/TS |
| testing | source JS/TS, tests, openspec, workflow/TDD scripts, test configs |

Testing-rule намеренно охватывает source: тестовые ограничения нужны до правки
production-кода, а не после открытия первого теста. Planning/review может явно
прочитать relevant rule раньше срабатывания paths. После загрузки rule не следует
считать его выгруженным при переходе к другому файлу. Не обещается снижение
контекста в каждой coding-сессии: все relevant rules всё равно будут нужны.

Не импортировать справочники через `@` и не загружать все skills/agents вручную.
Проверять реальную загрузку через `/context`; байты файлов — не точные токены и
не стоимость LiteLLM. Сравнивать новые сессии с одной и той же задачей.

## Границы совместимости

Сохранён старый lint toolchain: ESLint 8, react-app 7, typescript-eslint 5 из lock.
Он старше TS 5.9 и может сообщать о неподдерживаемой версии TypeScript; эта правка
не является миграцией на typescript-eslint 8/ESLint 9. Такой переход лучше делать
отдельной задачей с source-based проверкой. Naming не включает type-aware lint.

## Выполненная проверка patch

- 17 Node tests: workflow/TDD/baseline, architecture-refactor и sync adapters — PASS.
- 2 доступных starter-config checks: skill frontmatter и полнота docs/commands — PASS.
- ESLint 8.57.1 + react-app 7.0.1/typescript-eslint 5.62.0: 10 fixtures naming — PASS;
  проверены компоненты/hooks, const, type/interface, внешние keys/imports/destructuring.
  При явном переименовании destructured binding новое локальное имя проверяется.
- Проверены сохранение no-cycle warning, отсутствие formatting rules и отсутствие
  нового naming-rule в JS/JSX. Naming failures имеют severity warning.
- `agents:check`: 45 mirrors, 0 out of sync, 0 stale. JS syntax checks — PASS.
- Полный lint/typecheck/build/BDD/E2E не запускался: нет src/tests/openspec и
  полного окружения приложения. Проверка отсутствия тестов в src из
  starter-config.test.mjs требует полного репозитория и здесь не выполнялась.
- Зависимости для проверок установлены изолированно, не входят в patch и не меняют
  package-lock.json пользователя. Для локальных проверок React не устанавливался;
  eslint-plugin-react сообщает о fallback версии при detect.

## Что не входит в patch

node_modules, browser binaries, env/config с окружением, scheduled tasks,
аудиты и migration history. Они не удаляются из исходного проекта.
Существующие тесты, specs и implementation-код также не входят и не изменяются.
