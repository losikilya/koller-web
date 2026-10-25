# Testing and validation

The planning gate ran before behavior implementation. Four scenario drivers recorded RED failures for absent routes/controls, then GREEN and REFACTOR. Startup failures caused by Windows sandbox directory access and a missing test workspace link were rejected as RED. Ledger/report bytes remain under openspec/changes/archive/2026-10-26-dance-platform-foundation/evidence after native archive. Reports are excluded from formatting because their hashes are verified.

Mirrored tests live in tests/apps/web and tests/packages. Vitest stays a single sequential root process, preserving the TDD wrapper. Unit/RTL drivers exercise locale contracts, mobile keyboard behavior and Button semantics; message tests enforce namespace key parity. Architecture checks have positive and negative fixtures, static/dynamic import extraction and cycle rejection.

Canonical Gherkin remains executable: control scenarios through vitest-cucumber; two browser journeys through playwright-bdd. vitest-cucumber treats each step as a Vitest test, so BDD scenario hooks own RTL cleanup; ordinary tests clean up after each test. Browser tests verify all ten routes, metadata, landmarks, skip focus, 404/root behavior, compact language switching and reflow. Runtime page/console errors are captured. Existing browser override variables remain mutually exclusive and validated. No browser download occurred.

Commands: pnpm install --frozen-lockfile; pnpm agents:sync; pnpm agents:check; pnpm test:workflow; pnpm lint; pnpm boundaries; pnpm typecheck; pnpm format; pnpm test; pnpm test:ci; pnpm build; pnpm e2e; pnpm spec:validate; pnpm workflow ready dance-platform-foundation. Exact final results are in phase-1-report.md.

On Windows use pnpm.cmd. In this sandbox esbuild/Next/Playwright require execution with permitted parent-directory access; this is infrastructure permission, not a failing assertion. CI uses Node 24, pinned pnpm, frozen lock and installed Chrome channel. Hosted CI itself cannot be executed locally; its equivalent root verification is run here.

No existing coverage percentage threshold was present; reporters and source collection are retained and adapted to workspace roots. No static page composition unit tests were added merely for coverage. Browser smoke and source checks are not a WCAG compliance certificate; screen-reader, forced-colors, full physical-device and final branding/font reviews remain release work.
