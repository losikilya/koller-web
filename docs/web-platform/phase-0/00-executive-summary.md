# Phase 0 Executive Summary

Status: documentation only. Prepared 2026-10-14. No web application, cloud resources, migrations or mobile changes are authorized by this phase.

## Decision and evidence labels

- **Confirmed**: product requirements and ADR-001 through ADR-014 supplied for this task.
- **Verified**: observable in the cited mobile source at audit time; not a claim about runtime verification.
- **Proposed**: implementation guidance for the separate future repository; requires normal Phase 1 review.
- **Unknown**: not established by repository evidence or this task.

The product is a Hybrid Dance Platform, not an Expo web port. Its MVP is Identity, privacy-controlled Profile, and guest-first Playground with Practice Timer. Community, Events and Battles are future contexts. English is default; Russian is required. Accounts support email/password and Google OAuth. Guests save locally; authenticated users save presets in the cloud. Core timer functionality is free of registration gates.

## Verified foundation

The Koller mobile repository uses Expo 54, React 19.1, React Native 0.81.5, Expo Router, TypeScript and Zustand (`package.json`). Its real host flow serializes commands, writes events before publishing projected state, and hydrates from SQLite (`src/stores/demoBattle/useDemoBattleStore.ts`, `src/infrastructure/storage/appEventRepository.ts`). Native transport is newline-delimited JSON over TCP, despite the protocol filename `wsProtocol.ts` (`src/stores/judgingServer/useJudgingServerStore.ts`). Browser preview adapters provide neither persistent battle event storage nor real TCP sync. Existing session roles are local battle roles, not authenticated cloud accounts (`src/stores/session/useSessionStore.ts`).

Visual identity is dark with cyan actions, violet accents and Hauora type. Sources: `src/constants/Colors.ts`, `src/components/Text/Text.tsx`, `assets/fonts/`, and the discovery image `assets/hero.png`. Mobile layouts and native components are references, not drop-in Next.js components.

## Proposed foundation

Separate pnpm/Turborepo repository: Next.js + React + TypeScript, Supabase Auth/PostgreSQL, a thin Next.js BFF, and bounded feature modules. Packages expose explicit public entrypoints; application use cases stay independent of Next.js. SSR serves public pages; the timer engine and interactive UI execute client-side. No NestJS, Module Federation or separate micro-app deployments initially.

Cloud identity uses `auth.users.id`, an immutable UUID. Profiles, privacy, preferences and versioned micro-app data remain distinct. Owner-only base-table access and controlled public projection functions enforce privacy even when callers bypass the UI. All authenticated data requests are uncached. Timer presets use bounded JSONB with validated versions, atomic quotas and optimistic concurrency.

## What Phase 1 can take directly

Use [11-implementation-roadmap.md](11-implementation-roadmap.md) for bounded tasks and gates; [02-design-system-extraction.md](02-design-system-extraction.md) for token/component decisions; [06-database-and-privacy.md](06-database-and-privacy.md) and [07-api-and-contracts.md](07-api-and-contracts.md) for persistence and contracts; [09-practice-timer-specification.md](09-practice-timer-specification.md) for executable future acceptance requirements.

Phase 1 must resolve version compatibility, font/image rights, deployment region and authentication redirect domains. These are not reasons to re-audit mobile architecture. Unknowns and ownership are listed in [12-risks-and-open-questions.md](12-risks-and-open-questions.md).

## Completion boundary

Fifteen Markdown files, including [Phase0.md](Phase0.md), are the only outputs. The existing working tree was clean at the baseline. Documentation records static evidence, not device, browser, build or database execution results. No source tests were added or run. See [13-phase-0-acceptance-report.md](13-phase-0-acceptance-report.md).
