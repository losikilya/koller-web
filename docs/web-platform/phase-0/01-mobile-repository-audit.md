# Mobile Repository Audit

Verified by source inspection on 2026-10-14. Paths are relative to the existing mobile repository. Dependency versions below are manifest declarations, not a certification of installed binaries. No emulator or application server was started.

## Rules and workflow evidence

Read `AGENTS.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_WORKFLOW.md`, `docs/CODEX_TASKS.md`, and `.codex/config.toml`. The task's explicit documentation-only constraints override instructions to update `CLAUDE.md` or rebuild a knowledge graph. Graph tools are unavailable in this session; no `.mcp.json` exists in the inspected root. `CLAUDE.md` describes a graph integration, but its runtime availability is unknown.

`.agents/` is empty in the inspected checkout. `.codex/config.toml` specifies local coding-agent preferences, not a multi-agent orchestration workflow. No `openspec/`, OpenSpec configuration, test/spec files or tracked `.github` workflow files were found outside dependencies/native build artifacts. No existing OpenSpec planning workflow supports creating an artifact here. Older project documentation describes storage/network as future work; the implementation below is more advanced.

## Stack and execution

| Verified fact | Source | Current behavior | Web applicability and limitation | Class |
| --- | --- | --- | --- | --- |
| Private package `koller` 1.0.0; entry `expo-router/entry` | `package.json` | Expo application | Separate product repo; do not turn this package into the platform | D |
| Expo `~54.0.36`, React `19.1.0`, RN `0.81.5`, router `~6.0.24` | `package.json` | Native runtime and file routes | Select compatible web versions in Phase 1, not by copying RN versions | D |
| TypeScript `~5.9.2`, strict mode and source aliases | `package.json`, `tsconfig.json` | Shared type checking configuration | Strictness and explicit interfaces transfer; Expo base config does not | B |
| npm lockfile version 3; no packageManager field | `package-lock.json`, `package.json` | npm is the evidenced package-management workflow; exact npm/Node versions unknown | New repo uses accepted pnpm/Turbo decision | D |
| Scripts: start, android, ios, web, submit-ios | `package.json` | Expo start/run and EAS submission | No typecheck/lint/test/build scripts; none invented or executed | D |
| EAS preview APK and production profiles | `eas.json` | Native build distribution configured | Does not establish web CI/CD or hosted backend | D |
| Portrait, new architecture, Android permissions, iOS/tablet config, `koller` scheme | `app.json` | Android-first project also has iOS configuration | Product intent and existing iOS config coexist; actual support unknown | D |

## Navigation, UI and visual evidence

| Verified fact and behavior | Source | Potential web applicability | Risk or limitation | Class |
| --- | --- | --- | --- | --- |
| Root Stack, tab/auth groups, missing route, nested battle routes | `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/[...missing].tsx`, `src/app/(tabs)/profile/battle/[battleId].tsx` | Route ownership and error boundaries | `(auth)` here concerns local role entry, not Supabase login | B |
| Tabs redirect when no roles; host-specific navigation visibility | `src/app/(tabs)/_layout.tsx` | Shell navigation with capability-aware UI | Role checks are not cloud authorization; guests need unrestricted Playground routes | B |
| Component folders and named barrels; RN StyleSheet plus computed styles | `src/components/index.ts`, `src/components/Box/Box.tsx`, `src/components/Button/Button.tsx` | Component API and composition ideas | RN props, native layout and styling need HTML/CSS equivalents | C |
| Dark surface/cyan/violet palette, separate light constants | `src/constants/Colors.ts` | Raw token foundation | Config says light UI style while actual root is dark; no verified theme switch | C |
| Hauora type variants and real TTF assets | `src/components/Text/Text.tsx`, `assets/fonts/HauoraRegular.ttf`, `assets/fonts/HauoraBold.ttf`, `assets/fonts/HauoraExtraBold.ttf`, `app.json` | Font/typography reference | Native font plugin configured; no root `useFonts` call; web rights/Cyrillic coverage unknown | C |
| Ionicons directly imported; Icon only wraps children in a sized Box | `src/components/Icon/Icon.tsx`, `src/components/Header/Header.tsx`, `src/components/Select/Select.tsx`, `package.json` | Outline icon visual language | Do not describe Icon as an icon-library renderer; Expo package is not needed on web | C |
| Hero photo and app icon used by discovery | `src/screens/DiscoveryScreen/DiscoveryScreen.tsx`, `assets/hero.png`, `assets/icon.png` | Brand imagery reference | Hero bitmap inspected; ownership/license and final platform naming unknown | C |
| Design showcase contains component examples and external placeholder photos | `src/app/(tabs)/design.tsx` | Inventory/reference screen | Placeholder URLs are not production licensed assets or design specifications | C |
| Buttons: contained/outlined/text, color variants, disabled; inputs float labels and cyan focus | `src/components/Button/Button.tsx`, `src/components/Input/Input.tsx` | Web button/form equivalents | Primary button uses white text on cyan; contrast needs correction on web; no verified loading/error primitive | C |
| Cards: padding 24, radii 32/48, optional BlurView | `src/components/Cards/Card.tsx` | Surface and border reference | Oversized mobile framing should not dictate desktop shell; native blur needs adapter | C |
| Modal selectors, host roster modal and top menu | `src/components/Select/Select.tsx`, `src/screens/HostDashboardScreen/RosterListModal.tsx`, `src/components/AppTopMenu/AppTopMenu.tsx` | Dialog/menu interaction intent | Web focus trapping, escape, focus return and semantics must be added | C |
| Blurred bottom nav and safe-area handling | `src/components/TabBar/TabBar.tsx` | Compact touch navigation reference | Desktop should use persistent header navigation; native safe area is not reusable | C |
| Online/offline badge, skeleton animation, lists | `src/components/StatusBadge/StatusBadge.tsx`, `src/components/Skeleton/Skeleton.tsx`, `src/components/List/List.tsx`, `src/components/List/ListItem/ListItem.tsx` | Status, loading, row density reference | Native FlatList and index keys are not web list policy; no complete accessible state system | C |
| Box takes raw spacing; screen dimensions read at module initialization | `src/components/Box/Box.tsx`, `src/constants/Dimensions.ts`, `src/app/(tabs)/_layout.tsx` | Flex/grid and spacing concepts | No centralized spacing scale or responsive breakpoint system verified | C |
| Screen composition split into subordinate dashboard components | `src/screens/HostDashboardScreen/HostDashboardScreen.tsx`, `src/screens/HostDashboardScreen/StatCard.tsx`, `src/screens/HostDashboardScreen/HostTabs.tsx` | Compose feature views from focused components | Runtime viewport fit and all UI states not verified; no desktop adaptation inferred | C |
| Resource dictionary and typed lookup; English strings | `src/resources/resources.ts`, `src/resources/utils/getResource/getResource.ts` | Typed resource-key discipline | No locale selection/pluralization verified; qualification timer still has literal English UI | B |

## State, persistence and domain

| Verified fact and behavior | Source | Potential web applicability | Risk or limitation | Class |
| --- | --- | --- | --- | --- |
| Zustand host store includes commands, event log, queue, timer coordinator and hydration | `src/stores/demoBattle/useDemoBattleStore.ts` | Serialize critical writes and persist before state publication | Name says demo but store is used in real host/bootstrap paths; RN lifecycle/infrastructure imports prevent direct reuse | B |
| Command success events persisted then reduced; `event.create` replaces prior log | `src/stores/demoBattle/useDemoBattleStore.ts` | Explicit transaction/application boundary | Host log is not a multi-event cloud database; do not assume event archive retention | B |
| AppCommand/AppEvent discriminated unions and BattleAppState projection | `src/domain/commands/command.ts`, `src/domain/sync/appEvent.ts`, `src/domain/sync/appState.ts` | Plain TypeScript shapes can be shared in a later contract review | Not versioned public cloud API; no automatic copy to shared-kernel | A, E for MVP |
| Ranking computes averages; ties use score count, then stable input ordering | `src/domain/qualification/calculateRanking.ts` | Directly usable pure calculation after future validation | Tie-break TODO remains; not a new platform rule | A, E for MVP |
| Majority helper returns winner/null; command layer handles workflow | `src/domain/battle/calculateBattleWinner.ts`, `src/domain/commands/commandHandlers.ts` | Pure winner helper | All-votes completion requirement is separate from majority helper; no change authorized | A, E for MVP |
| General seed generator supports top8/16/32; custom grouping also present | `src/domain/bracket/generateBracket.ts`, `src/domain/event/types.ts` | Future battle algorithm/reference | Generates IDs via random/time helper, so full function is not deterministic/pure | B, E for MVP |
| Reducer has no RN imports but timestamped system logs use current time | `src/domain/sync/applyEvent.ts` | Event projection pattern | Replay log timestamps are not deterministic; pure intent differs from implementation | B, E for MVP |
| Command/event factories use Date and generated IDs | `src/domain/commands/createCommand.ts`, `src/domain/sync/createAppEvent.ts`, `src/shared/lib/createId.ts` | Explicit factory boundary concept | ID uses prefix + timestamp + Math.random; not UUID or cryptographic identity | B |
| Participants have local string ID, optional battleConfigurationId, number, name, crew/city/photo and status | `src/domain/participant/types.ts` | Later nullable global identity link | No `userId` or account relationship; membership is configuration scope, not global event membership | A, E for MVP |
| Event owns configurations and active selection; judges assigned by IDs | `src/domain/event/types.ts`, `src/domain/sync/stateSelectors.ts` | Future domain vocabulary | Event admin/judge membership cannot be equated with profile identity | A, E for MVP |
| SQLite `koller.db`; WAL, ordered autoincrement log and metadata | `src/infrastructure/storage/database.ts`, `src/infrastructure/storage/migrations.ts`, `src/infrastructure/storage/appEventRepository.ts` | Persistence port/replay concepts | SQLite implementation is native; JSON parsing drops syntax-invalid records and casts shapes without schema validation | B |
| Transactions write batches; insert-or-ignore deduplicates by event ID | `src/infrastructure/storage/appEventRepository.ts` | Atomicity/idempotency intent | Duplicate content equality and full corruption recovery are not established | B |
| Web event adapter uses module memory only | `src/infrastructure/storage/appEventRepository.web.ts` | Preview fallback only | Events vanish on reload; does not meet new guest persistence requirements | D |
| Device identity in SQLite metadata; web identity uses localStorage | `src/infrastructure/storage/clientIdentityRepository.ts`, `src/infrastructure/storage/clientIdentityRepository.web.ts` | Distinguish device/account identities | Untrusted device ID is not authentication | B |
| Host/client state selection filters active configuration | `src/stores/battle/useBattleState.ts` | Read model selection pattern | React hook and Zustand/private stores must not become global cloud contract | B |

## Network and native dependencies

| Verified fact and behavior | Source | Potential web applicability | Risk or limitation | Class |
| --- | --- | --- | --- | --- |
| Host TCP server and client sockets; JSON messages framed by newline | `src/stores/judgingServer/useJudgingServerStore.ts`, `src/stores/judgingClient/useJudgingClientStore.ts` | Host authority remains a future integration constraint | `wsProtocol.ts` is message typing, not WebSocket implementation; browsers cannot open raw TCP | D |
| Join returns snapshot; new clients assigned spectator; host assigns roles; command checks judge identity/MC command subset | `src/domain/sync/wsProtocol.ts`, `src/stores/judgingServer/useJudgingServerStore.ts` | Role/ownership checks and snapshot concepts | No provider auth or TLS setup observed in transport; LAN device claim is not global identity proof | B, E for MVP |
| Client reconnect states, max attempts, snapshot/event projection | `src/stores/judgingClient/useJudgingClientStore.ts` | Recovery UX/reference | No assumption of cloud retry guarantees, durable outbox or exactly-once delivery | B |
| Network address resolver, native interfaces, manual/QR address validation | `src/infrastructure/network/hostAddressResolver.ts`, `src/infrastructure/network/nativeNetworkInterfaces.ts`, `src/infrastructure/network/connectionAddress.ts`, `plugins/withHostNetworkInterfaces.js` | Versioned connection payload idea | Native LAN discovery/interface plugin remains mobile only | D |
| Web server disabled; web client is preview with remote commands disabled | `src/stores/judgingServer/useJudgingServerStore.web.ts`, `src/stores/judgingClient/useJudgingClientStore.web.ts` | None for production cloud transport | Preview connected status is not proof of sync | D |
| Bootstrap restores storage and starts/stops native host server | `src/components/AppBootstrap/AppBootstrap.tsx` | Explicit startup/recovery lifecycle | Native behavior was statically verified, not exercised | B |
| Camera, QR SVG, document picker/XLSX import, gesture/safe-area/screens, Expo image/blur/font/network/SQLite/browser/linking | `package.json`, `src/infrastructure/import/participantsExcelImport.ts`, `src/app/scan-qr.tsx`, `app.json` | Port user intent only when needed | Native dependencies not copied to Next.js; spreadsheet import and battle QR are outside MVP | D, E |
| Zod declared, no verified source import in inspected src tree | `package.json`, source import search | Proposed Zod web contracts | Dependency presence does not prove existing boundary validation | B |

## Reuse disposition

A means pure TypeScript/type declarations whose dependencies and behavior were inspected. B means concepts or contracts needing a browser/persistence/clock adapter. C means design reference only. D means native/platform implementation not reusable. E means outside initial web scope, even if technically reusable. Reuse is eligibility, not an instruction to move files. Mobile source remains independent and unchanged.

Unknown: installed runtime versions, physical-device LAN reliability/security, complete accessibility compliance, font licenses/glyph coverage, asset licensing, hosting/traffic requirements, production CI and runtime visual parity. None is asserted as verified.
