# Phase 2 implementation report

Status: Phase 2 complete. Full verification exit 0, independent review PASS, workflow ready true, native archive complete and stable specs strictly validated. No Phase 3 work, commit or publication.

## Result and boundaries

Eleven reusable UI primitives, centralized raw/semantic tokens, Storybook and refined existing shell/pages. EN/RU route ownership and placeholder content remain intact. No authentication/Supabase, Practice Timer logic, battles, mobile edits, commit or publication. Architecture remains ADR-0002; read-only architect consultation found no ADR impact.

Provenance, full token inventory and accessibility decisions: [design-system.md](design-system.md). Component props, examples and deferred controls: [component-inventory.md](component-inventory.md).

## Changed paths

- packages/design-tokens/src/tokens.css: raw references, semantic aliases, typography/spacing/focus/motion/layout and responsive gutters.
- packages/ui/src/index.tsx, Dialog.tsx, Tabs.tsx, Primitives.module.scss: public primitives and shared action-link class helper; explicit root export preserved.
- packages/ui/stories/Primitives.stories.tsx and .storybook/{main.ts,preview.ts,preview.scss,styles.d.ts,tsconfig.json}: supported framework, accessible examples and shared tokens/fonts.
- apps/web/src/app/globals.scss; shell/{HomePage.tsx,IdentityPage.tsx,MobileNavigation.tsx,Shell.module.scss}; modules/playground/Pages.tsx; shared/styles/Pages.module.scss: shared components/action styles and token usage; navigation structure preserved.
- tests/bdd/designSystem/{controls.feature,controls.steps.tsx}; tests/packages/ui/Controls.test.tsx; tests/e2e/designSystem/\*; tests/e2e/helpers/a11y.ts; foundation/accessibility.spec.ts: recorded cycles, controlled state, keyboard/focus, WCAG, reduced motion and responsive regression guards.
- package.json/pnpm-lock.yaml, playwright.bdd.config.ts, playwright.storybook.config.ts, .gitignore: local Storybook tooling/gates, separate browser targets/artifacts. All original verification stages retained.
- docs/web-platform/phase-2/\* and owning OpenSpec change: contracts, provenance, evidence and review. Archived history remains untouched.

## Dependencies

New dev tooling: storybook, @storybook/nextjs-vite, @storybook/addon-a11y at 10.6.3; axe-core 4.14.0 (same instance as addon, direct declaration for browser audit). Root declares existing Next 16.4.3, Sass 1.77.6 and workspace design-tokens for direct tooling imports. Existing React/Next/TS/Vite and retained dependency versions are preserved; pnpm 8.15.4 remains authoritative. No runtime headless/component framework.

## Evidence

- Original full baseline: pnpm verify exit 0 with installed Edge, ci-reports/phase-2/baseline.log. Earlier esbuild sandbox denial and absent bundled Chromium were infrastructure failures, never RED evidence.
- Six loadable assertion failures recorded before their implementations; six GREEN and six REFACTOR runs passed with unchanged driver hashes. Evidence resides with phase-two-design-system OpenSpec change.
- Initial Storybook static build exit 0. Six Storybook Edge browser tests passed, including native modal focus/background inertness and restore, keyboard tabs, axe WCAG at 320/1280px and reduced motion. Strict typecheck passed after scoped stylesheet declarations.
- Full expanded `pnpm verify`: exit 0, log `ci-reports/phase-2/verify.log`. All original stages plus Storybook build/browser passed: agents, 20 workflow tests, zero lint errors/cycle warnings, boundaries, strict application/package/story/config types, formatting, 31 assertions in eight Vitest files, coverage, Next production build, Storybook static build, 17 application Edge checks, six Storybook Edge checks, strict OpenSpec validation. Axe reported zero violations in the tested WCAG A/AA states across all ten localized routes and component examples. Coverage: statements 43.19%, branches 60.37%, functions 50%, lines 42.95%; existing thresholds unchanged.
- Screenshots visually inspected: mobile Russian Playground at 320px, tablet Russian Register at 768px, desktop English Home, component states at 320px and desktop modal. Reflow has no horizontal overflow; focused skip link intentionally overlays the header. Physical-device/NVDA testing was not performed.
- Independent reviewer: PASS on specification/evidence and engineering/ADR/simplicity, one read-only pass; actual review saved with the owning change. Frozen offline lockfile installation: exit 0, `ci-reports/phase-2/frozen-install.log`. Final documentation formatting: exit 0.
- `pnpm workflow ready phase-two-design-system`: exit 0, ready true for six scenarios. `pnpm spec archive phase-two-design-system --yes`: exit 0, created stable `design-system` specification with four requirements and archived natively as `openspec/changes/archive/2026-10-26-phase-two-design-system`. Previous archives were not edited. Post-archive `pnpm spec:validate`: exit 0, both design-system and platform-shell pass strict validation. Archive log: `ci-reports/phase-2/archive.log`.

Recorded evidence and actual review: [archived change](../../../openspec/changes/archive/2026-10-26-phase-two-design-system/). No requested implementation work remains. Local developer preview: `pnpm storybook`; application: `pnpm dev`.

The first modal browser assertion incorrectly assumed browser chrome was excluded from native Shift+Tab navigation. It was corrected to check actual focus order and inert background, while retaining Escape/explicit dismissal/restoration assertions. No production custom trap was added; unit assertions and recorded TDD driver stayed unchanged.

## Known limitations

System fonts remain intentional: Hauora redistribution rights/Cyrillic coverage are unverified. No physical-device or NVDA session executed. Storybook/Vite emits upstream client-directive/source-map and chunk-size warnings in its client-only preview; app client boundaries stay intact. Existing upstream CRA deprecations and optional vitest-cucumber generator bin warning remain. No cycle warning suppression or coverage weakening. Root shell commands require access to existing native build caches in this Windows environment.
