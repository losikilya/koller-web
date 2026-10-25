# Phase 2 Design System

## Why

The platform currently has only Button and Container. Future modules need reusable accessible controls and one visual vocabulary grounded in the verified mobile sources.

## What Changes

- FR-101: Shared actions support variants, sizes and busy/disabled states; inputs expose persistent labels, descriptions and errors.
- FR-102: Modal dialogs support dismissal and deliberate focus; local tabs support keyboard selection and controlled/uncontrolled ownership.
- FR-103: Shared surfaces, badges, loading and empty states consume the authoritative semantic tokens; existing pages and responsive shell use them without changing routes or placeholder behavior.
- FR-104: Storybook demonstrates the public components and their states using the application tokens and fonts.

## Capabilities

### New Capabilities

- `design-system`: Accessible reusable controls, presentation primitives and isolated component examples.

### Modified Capabilities

None. Existing platform-shell contracts remain regression guards.

## Impact

Extend packages/ui and packages/design-tokens, refine existing shell/page styles, add Storybook tooling and mirrored tests. Preserve Next/React/TS versions, EN/RU routing, current quality gates and agent workflows. No authentication, Supabase, timer functionality, battles, mobile edits, commits or publication. Native dialog avoids a new runtime framework. Independent architect consultation confirms no ADR change.
