# Phase 2 design system

## Authority and provenance

Single token authority: `packages/design-tokens/src/tokens.css`, exported as `@dance/design-tokens/tokens.css`. Raw values use `--raw-*`; components consume semantic aliases. No app/package duplicate palette. UI lives in `packages/ui`, uses SCSS Modules, and exports only its named public API. No new architecture boundary or ADR: read-only architect consultation confirmed ADR-0002 remains applicable.

Mobile repository was read only: `C:/Users/Lenovo/dance-battle-app`. Directly verified `src/constants/Colors.ts`, `src/components/Button/Button.tsx`, `src/components/Text/Text.tsx` and Input styles/200ms transition. Phase 0 extraction supplies Card/IconButton/radius and other reference inventory. These are source values, not screenshot measurements. No mobile edits or font/image copying.

| Reference                         | Extracted value              | Web decision                                               |
| --------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| Colors dark background/raised     | #0b0c0e / #13131c            | canvas / raised                                            |
| Card (Phase 0 verified reference) | #0e1417                      | card surface                                               |
| Primary main / dark               | #4cd6ff / #004e60            | cyan action and retained raw dark reference                |
| Primary contrastText              | #000                         | black on cyan; correct mobile button's white text contrast |
| Secondary main                    | #ecb1ff                      | secondary actions, accents and primary hover               |
| Text primary                      | #fff                         | default foreground                                         |
| Text secondary                    | #8789a6                      | adapted to #b4b5c8 for muted web text                      |
| Error / online / warning          | #fc5a5a / #37fe11 / #ffc107  | semantic feedback; always accompanied by text              |
| Control border                    | rgba(255,255,255,.5)         | meaningful control boundaries                              |
| Decorative border                 | mobile white .08             | adapted to .12; decorative only                            |
| Primary subtle / selected         | cyan .08 / .15               | hover/selected surfaces                                    |
| Overlay                           | rgba(11,12,14,.7)            | native dialog backdrop                                     |
| Text body / body2 / h1            | 16/24, 12/18, 32/48 RN units | rem scale; headings use web line heights                   |
| Input radius / Button radius      | 12 / 32 RN units             | 12px controls/dialog; pill buttons are web adaptation      |
| Common spacing                    | 4/8/12/16/20/24              | rem spacing scale plus web layout 32/48/64                 |
| Input transition                  | 200ms                        | normal 200ms; web hover 120ms                              |

Hauora font files exist in the mobile reference but redistribution rights, weight metadata and Cyrillic coverage are unverified. Keep Phase 1 system sans stack; no synthetic Hauora weights or licensing claims. Existing abstract homepage art remains CSS, with its cyan glow mapped to a token. Photography and custom fonts are deferred.

## Final token inventory

| Group            | Tokens / values                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raw color        | black, white, canvas, raised, card, cyan, cyan-dark, violet, danger, success, warning, muted-web, control, separator-web, cyan-subtle, cyan-selected, scrim (values above) |
| Surfaces         | surface-canvas, raised, card, hover, selected; overlay-scrim                                                                                                               |
| Text             | text-default, muted, placeholder (muted web value)                                                                                                                         |
| Actions          | action-primary, on-primary, primary-hover, primary-active, secondary                                                                                                       |
| Feedback         | feedback-danger, success, warning                                                                                                                                          |
| Boundaries/focus | border-decorative, border-control, border-width 1px; focus-ring cyan, focus-width 2px, focus-offset 4px                                                                    |
| Typography       | font-body system stack; caption .75rem, small .875rem, body-size 1rem, subtitle 1.125rem, section 1.5rem, title 2rem, display 3.75rem, display-compact 2.5rem              |
| Rhythm           | line-body 1.5, reading 1.7, heading 1.25, display 1.08; weight-regular 400, bold 700, heavy 800; tracking-label .12em, display -.04em                                      |
| Spacing          | space-0 0; space-1/2/3/4/5/6/8/12/16 = .25/.5/.75/1/1.25/1.5/2/3/4rem                                                                                                      |
| Radius           | control .75rem, card .5rem, dialog aliases control, pill 9999px, circle 50%                                                                                                |
| Elevation        | elevation-overlay 0 8px 24px rgba(0,0,0,.35), explicitly web adaptation                                                                                                    |
| Layout           | content-max 75rem, dialog-max 36rem, target-min 2.75rem, header-height 6rem; gutter 1/1.5/2rem                                                                             |
| Motion           | motion-fast 120ms, normal 200ms, loading 800ms, easing ease-out; durations 0ms under reduced motion; spinner animation disabled                                            |
| Disabled         | disabled-opacity .5; native disabled prevents activation                                                                                                                   |

Unqualified size/line-height/layout/interaction values above are web adaptations, not an extracted mobile token system. Breakpoint convention: compact below 640px, medium 640–1023px, wide at 1024px. Central responsive gutter definitions live in tokens.css. Existing navigation/page composition changes at 768px for localized link fit; this Phase 1 behavior is preserved. CSS custom properties cannot be media-query conditions, so media conditions use documented literals rather than a parallel token object.

## Accessibility decisions

Native buttons and inputs preserve browser semantics; IconButton requires a string accessible name. Input keeps a persistent label and associates description/error text. Loading preserves button names and prevents activation; LoadingIndicator provides a caller-translated status. Badge never creates a live region automatically.

Dialog uses native showModal/inert background and Escape, a labelled close button, scroll lock and trigger focus restoration on close/unmount. Browser chrome remains reachable via keyboard as native Edge behavior; background document controls cannot receive focus while modal. No custom focus trap or headless dependency is required for this simple controlled modal. Nested modals are outside the current contract.

Tabs use automatic synchronous selection with ArrowLeft/Right wrapping, Home/End, disabled skipping, roving tabindex and linked panels. They switch local content; route navigation remains locale-aware links. Controlled selection belongs to the caller; uncontrolled state stays local. Only Dialog/Tabs have client directives; the package barrel and static primitives remain server compatible.

WCAG automated checks and browser keyboard journeys are evidence for tested states, not a complete compliance certificate. Manual NVDA and physical-device checks remain unexecuted.
