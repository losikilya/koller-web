---
name: accessibility
description: Audit, design and verify frontend accessibility against WCAG 2.2 principles; use for interactive UI, forms, dialogs, navigation, dynamic status, keyboard or screen-reader behavior and dedicated accessibility reviews
---

# Accessibility workflow

Treat WCAG AA as the default product target unless the repository documents another target. Use automated tools as evidence, never as a compliance certificate.

## 1. Establish the interaction contract

- Read the OpenSpec scenarios, nearby UI and existing tests.
- Identify the user task, interactive elements, dynamic updates, error states and focus transitions.
- Inspect the rendered accessibility semantics when browser access exists.
- Reuse accessible behavior from the current components (`packages/ui-kit`, `ui`); do not create wrappers or migration work outside the requested scope.

## 2. Review in impact order

1. Keyboard traps, inaccessible primary actions and lost focus.
2. Missing or incorrect accessible names, labels, roles, states and relationships.
3. Forms: instructions, required state, error identification and focus after submission.
4. Dialogs, drawers, menus and popovers: entry focus, containment when required, Escape behavior and focus restoration.
5. Dynamic UI: `aria-live` or `role=status/alert` only where users need an announcement.
6. Structure: landmarks, heading order, lists and meaningful link/button text.
7. Visual access: contrast, visible focus, zoom/reflow, target size and reduced motion.

Prefer native HTML. Use ARIA only to express semantics unavailable in native elements; never add roles that contradict the element.

## 3. Verify at the right layers

- RTL: semantic queries, accessible names, keyboard interactions, form errors and observable state.
- Playwright BDD: focus order/restoration, real navigation, browser dialogs, layout/reflow and critical keyboard journeys.
- Automated audit: axe or Lighthouse when configured. Record affected URL/state and exact violations.
- Manual: keyboard-only pass; critical flows with NVDA on Windows when release risk justifies it; 200% zoom and reduced motion where relevant.

Do not assert implementation-only ARIA when a user-visible role/name assertion proves the same contract. Do not claim screen-reader verification unless it actually ran.

## Findings

For each finding return severity, path or rendered state, affected user, WCAG/pattern rationale, reproduction, smallest fix and required verification. Separate measured failures from source-only hypotheses.
