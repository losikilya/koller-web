# Risks and Open Questions

Verified risks cite existing files. Proposed design risks are not assertions of mobile defects or implemented cloud behavior. Owners below are recommended roles, not assigned people.

| Priority | Evidence/status | Risk / decision needed | Proposed mitigation / owner / timing |
| --- | --- | --- | --- |
| High | Verified: `src/shared/lib/createId.ts`, `src/domain/participant/types.ts`, `src/stores/session/useSessionStore.ts` | Local ID/device/role mistaken for global user/account | UUID auth identity, optional scoped participant map; architecture owner before any integration |
| High | Verified: `src/stores/judgingServer/useJudgingServerStore.ts`, `src/domain/sync/wsProtocol.ts` | Existing TCP/LAN flow assumed to be secure cloud WebSocket API | Keep independent; security review in future integration; no transport rewrite now |
| High | Proposed DB design | Public profile privacy bypass through raw tables, caching, definer grants or avatars | Owner-only tables, exact/list projection functions, no-store, direct DB tests; backend/security owner Phase 2 |
| High | Proposed auth | Account takeover/duplicate account after provider linking | Provider-supported linking only, fresh auth, staging provider tests; identity owner Phase 2 |
| High | Proposed cleanup | Deleted accounts republished after restore or leftover storage | Hide first, durable retries, storage cleanup and tombstone replay; operator/privacy owner Phase 2/5 |
| Medium | Verified: `src/domain/sync/applyEvent.ts`, `src/domain/bracket/generateBracket.ts`, `src/domain/commands/createCommand.ts` | Functions called pure but read clock/generate IDs | Classify B; future injected clock/ID if reused; do not modify mobile in this phase |
| Medium | Verified: `src/infrastructure/storage/appEventRepository.web.ts` | Preview mistaken for durable guest persistence | Separate validated local preset adapter; Playground owner Phase 3 |
| Medium | Verified: `src/components/Button/Button.tsx`, `src/constants/Colors.ts` | White-on-cyan contrast and decorative border used as accessible boundary | Semantic black primary text and contrast checks; design owner Phase 1 |
| Medium | Unknown: `assets/fonts/*`, `assets/hero.png`, `assets/icon.png` | Font/assets redistribution rights, Cyrillic glyphs, final platform naming | Confirm license/glyph metadata/brand scope; use approved fallback where needed; product/design owner Phase 1 |
| Medium | Verified: `src/constants/Dimensions.ts`, `src/components/Box/Box.tsx` | Mobile static dimensions assumed desktop responsive | Proposed grid/breakpoints, reflow QA; web design owner Phase 1/3 |
| Medium | Verified: `src/resources/resources.ts`, `src/components/QualificationTimerDisplay/QualificationTimerDisplay.tsx` | English dictionary assumed complete i18n | New module namespaces EN/RU and translation review; product/localization owner Phase 1+ |
| Medium | Proposed browser behavior | Suspension/audio/clock changes create false precision expectations | Paired clocks, explicit limitations, reload reset policy, browser matrix; Timer owner Phase 3 |
| Medium | Proposed cloud presets | Guest import/last-write wins loses cloud or local work | Explicit import, UUID retry mapping, revisions, atomic quotas; Playground owner Phase 4 |
| Medium | Unknown traffic/cost/region | 100k registrations mistaken for concurrency/capacity | Establish workload/SLO/cost baseline and staged benchmarks; operations owner Phase 5 |
| Medium | Verified: `package.json`, `.agents/`, `.codex/config.toml` | Future OpenSpec/TDD described as existing infrastructure | Adopt only in new repo, pin tools and prove gates; engineering owner Phase 1 |

## Decisions before their dependent implementation

1. New web repository name/destination, platform brand continuity versus Koller battle product name; no new identity invented here.
2. Exact supported Next/React/pnpm/Turbo/Node/Supabase SSR/next-intl/test-tool versions and approved dependencies. The existing mobile manifest does not choose web versions.
3. Font licensing/Cyrillic coverage and image rights; whether Hauora can be self-hosted on web. Real assets were found, rights were not.
4. Hosting/Supabase region, deployment origins and OAuth redirect allowlists, SMTP/sender domain, security/operations owner and budget.
5. Profile handle policy, reserved names, public canonical UUID route versus additional username aliases; moderation/reporting expectations. Privacy defaults and immutable identity are already confirmed.
6. Whether avatar upload ships in MVP. Schema reserves path; upload/policy is optional until explicitly accepted.
7. Timer configurable bounds/defaults, real-time suspension fallback tolerance, no active reload recovery, final-rest omission and audio choice. Complete proposed behavior is documented, not an unverified existing feature.
8. Preset byte/count budgets, duplicate comparison/import UX, cloud draft retention and local multi-tab guarantees. Proposed defaults are explicit and configurable.
9. Legal/data-processing regions, retention, deletion SLA, backup aging, audit logs and public data indexing policy. No legal compliance claim made.
10. Browser/device support matrix and acceptable performance/accessibility/SLO budgets before release.

## Unknown verification limits

No installed dependency inspection, native run, Expo start, build, physical LAN test, screen rendering, database policy execution or browser sleep test was performed. All behavior findings are static-source facts; only assets/hero.png was visually inspected. Runtime operational status is not certified. No existing backend, cloud account identity or Playground module was found in inspected sources. No hidden external orchestration/CI/cloud configuration can be inferred from absence in this checkout.

Documentation can support a precise Phase 1 task without settling every later product decision. Resolve blockers at the relevant phase, not by implementing future features early.
