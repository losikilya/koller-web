---
name: playwright-bdd
description: Design, implement and debug reliable Playwright BDD browser scenarios; use for navigation, focus, layout, permissions, browser APIs, multi-page journeys and flaky E2E tests
---

# Playwright BDD workflow

The `.feature` file owns executable examples and Playwright step definitions own browser mechanics. Requirements come from OpenSpec when a change owns the scenario; otherwise from the current code and existing specs.

## Scenario design

- Scenarios of an OpenSpec change carry change, requirement and scenario tags. Characterization scenarios from `/test-module` carry none of these tags and create no OpenSpec artifacts.
- Follow the AGENTS.md test layout: `tests/e2e/<domain>/<scenario>.feature` beside its `.steps.ts`. Share a steps file between features of one domain only for genuinely common steps; browser checks that need no Gherkin are `*.spec.ts` in the separate Playwright project.
- Describe user intent and observable outcome; keep selectors and click details out of Gherkin.
- Use browser E2E only for behavior that jsdom/unit/component tests cannot prove.
- Keep scenarios independent, deterministic and small enough to diagnose.

## Implementation

- Prefer `getByRole`, `getByLabel`, visible text and stable product-facing identifiers.
- Use Playwright assertions and auto-waiting. Never use `waitForTimeout` as synchronization.
- Wait for a user-observable state or specific response only when the product contract requires it.
- Keep steps thin. Extract fixtures/helpers around domain operations; introduce a Page Object only when it reduces real duplication without hiding assertions.
- Isolate browser context, auth, time and test data. Do not depend on scenario order.
- Mock a third-party boundary only when the scenario is not intended to validate that integration. Keep core user flow as real as the environment permits.

## Special cases

- Authentication: reuse storage state only when isolation and expiry are controlled.
- Permissions/camera/clipboard/geolocation: set explicit context permissions and verify denied as well as granted states when required.
- Time: freeze or control time; do not depend on the wall clock.
- Network failures/offline: simulate at the browser boundary and assert recoverable UI.
- Accessibility: verify real focus movement/restoration and keyboard journeys; use `accessibility` for the wider audit.

## Failure handling

Retain trace on failure and inspect DOM, console and network evidence before editing. A missing browser or broken harness is infrastructure failure, not TDD RED. Use `systematic-debugging` for flaky or non-obvious failures.
