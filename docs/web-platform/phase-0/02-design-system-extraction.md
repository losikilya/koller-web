# Design System Extraction

All extracted values below are source values, not screenshot measurements. Proposed web tokens are design recommendations. Existing mobile source remains unchanged. Primary identity: near-black surfaces, bright cyan interaction, violet secondary accents, white type, outline icons and dance photography. `assets/hero.png` was visually inspected; running screens were not.

## Extracted raw palette

Source: `src/constants/Colors.ts`. Keep original values in the reference inventory; semantic mapping may correct contrast.

| Source token | Raw value |
| --- | --- |
| light.text / background / tint / tabIconDefault | #000 / #fff / #2f95dc / #ccc |
| dark.text / background / backgroundLight / tint | #000 / #0B0C0E / #13131C / #fff |
| dark.backgroundOverlay | rgba(11,12,14,0.7) |
| primary.main and light / dark / contrastText | #4cd6ff / #004e60 / #000 |
| primary.subtle / subtleAlt | rgba(76,214,255,0.08) / rgba(76,214,255,0.15) |
| secondary.main / dark / light / contrastText | #ecb1ff / #d05bff / #ffdad6 / #75B3FF |
| text.primary / secondary / hint | #ffffff / #8789A6 / #92929D |
| text.disabled / placeholder / error | rgba(146,152,170,0.5) / rgba(255,255,255,0.45) / #F54342 |
| error.main / dark / light / contrastText | #FC5A5A / #FB3F3F / #FD7575 / #000 |
| status.online / warning | #37fe11 / #FFC107 |
| border.subtle | rgba(255,255,255,0.08) |
| role.judgeBackground / mcBackground | rgba(0,209,255,0.1) / rgba(208,91,255,0.2) |
| warning.background / border | rgba(147,0,10,0.2) / rgba(255,180,171,0.3) |

Additional extracted raw values outside the central palette: card #0e1417 and rgba(255,255,255,0.50), dark card rgba(11,12,14,0.75) (`src/components/Cards/Card.tsx`); black/white, control border rgba(255,255,255,0.5), selector #111/#222 and overlay rgba(0,0,0,0.5) (`src/components/Input/Input.tsx`, `src/components/Select/Select.tsx`). These are evidence of inconsistent centralization, not a second approved theme.

## Proposed semantic mapping

| Web token | Source/value | Application |
| --- | --- | --- |
| surface.canvas / surface.raised / surface.card | dark.background / dark.backgroundLight / #0e1417 | Canvas, secondary tools, repeated items |
| text.default / muted / subdued | text.primary / text.secondary / text.hint | Reading and metadata; test contrast on actual surfaces |
| action.primary.bg / fg | primary.main / primary.contrastText | Cyan with black foreground, correcting white-on-cyan mobile button |
| action.secondary.fg / border | secondary.main / secondary.dark | Secondary commands and selection accents |
| border.decorative / control | border.subtle / rgba(255,255,255,0.5) | Decorative separators versus visible input boundaries |
| focus.ring | primary.main | Visible keyboard outline; not color-only selection |
| feedback.danger / success / caution | error.main / status.online / status.warning | Combine color, icon and text |
| overlay.scrim | dark.backgroundOverlay | Dialog background |

Do not inherit `dark.text` for body text: it is black in source. No verified theme switching exists; propose a dark MVP and defer a complete light theme. Keep color tokens serializable in `packages/design-tokens`, without RN dependencies.

## Extracted typography

Source: `src/components/Text/Text.tsx`. Units are RN layout units, proposed web equivalents use CSS rem at a 16px baseline.

| Variant | Size / line height | Declared weight | Family | Tracking / transform |
| --- | --- | --- | --- | --- |
| h1 | 32 / 48 | 800 | HauoraExtraBold | 3.2 / uppercase |
| h2 | 28 / 42 | 600 | HauoraBold | 0.84 |
| body | 16 / 24 | 400 | HauoraRegular | 0.96 |
| bodyBold | 16 / 24 | 600 | HauoraBold | 0.96 |
| body2 | 12 / 18 | 400 | HauoraRegular | 0.96 |
| button, caption | 16 / 24 | 600 | HauoraBold | 0.64 |

Assets: `assets/fonts/HauoraRegular.ttf`, `HauoraBold.ttf`, `HauoraExtraBold.ttf`; native registration in `app.json`. Actual font metadata weight, web redistribution license and Cyrillic coverage are unknown. Proposed web weights 400/700/800 require metadata confirmation; do not silently synthesize 600 from an unverified file.

Proposed scale: metadata 12/18, label 14/20, body 16/24, section 20/28, title 28/42, display 32/48. Headings are semantic HTML, independent of visual variant. All web letter spacing is 0; uppercase is reserved for short visual labels to preserve identity without long Russian uppercase blocks. Timer display 64/72 desktop and 48/56 compact, fixed per breakpoint with tabular numerals. Font-size does not track viewport width. Use Hauora with system sans fallback if rights/glyphs fail. WOFF2 conversion is Phase 1 work only after rights confirmation.

## Spacing, radius, border and elevation

Extracted: Box accepts arbitrary numeric margin/padding/gap rather than a token scale (`src/components/Box/Box.tsx`). Common values 4/6/8/12/16/20/24 occur in StatusBadge, Input, Select, Button and Cards. Input label uses 42 top margin; that is a component offset, not a global spacing token. `src/constants/Dimensions.ts` derives header/footer from static screen height, not responsive layout.

Proposed spacing scale: 0, 4, 8, 12, 16, 20, 24, 32, 48, 64px equivalents in rem. Use 6px only in compact status alignment if justified. Web content gutters 16 compact, 24 medium, 32 wide; maximum shell content width proposed 1200px; timer inner width proposed 720px. Grid tracks use minmax(0, 1fr); long text wraps without shifting icon/control dimensions.

Extracted radii: Input/Select 12, IconButton 16, Button/Card 32, rounded Card/Background 48, circular Avatar 100 (`src/components/Input/Input.tsx`, `src/components/Select/Select.tsx`, `src/components/IconButton/IconButton.tsx`, `src/components/Button/Button.tsx`, `src/components/Cards/Card.tsx`, `src/components/Avatar/Avatar.tsx`). Proposed web: control 8/12, repeated card 8, dialog 12, pill 9999, avatar 50%. Rounded primary buttons may retain pill identity; page sections stay unframed. This is an explicit adaptation, not an extracted universal 8px mobile token.

Extracted borders: typically 1 unit; subtle white separators, violet outlined actions, stronger white controls. Extracted elevation: Input animated label uses elevation 10; no reusable shadow scale verified. Card blur intensity 16; TabBar blur intensity 60 (`src/components/TabBar/TabBar.tsx`). Proposed web: flat surfaces normally; overlay shadow 0 8px 24px rgba(0,0,0,0.35), with border and opaque fallback. Blur is optional enhancement, never essential for contrast.

## Components and proposed web equivalents

| Mobile reference | Observed states | Web equivalent and required added states |
| --- | --- | --- |
| Button, IconButton | Variants, disabled, touch opacity | Native button; hover, active, focus-visible, busy; accessible icon label/tooltip; stable 44px minimum target |
| Input | Controlled/uncontrolled, floating label, focus | Associated persistent label, input, description/error IDs, autocomplete, invalid/busy state; compact 16px text |
| Select, CardSelect | Modal options, selected, focused | Native select for small lists; accessible listbox only if needed; keyboard arrows, selection, escape, focus restoration |
| Card | Sizes, blur, rounded/dark | Article/list-item surface with natural height; no nested decorative page cards |
| Header, TabBar, AppTopMenu | Back action, local-role tabs, modal menu | Semantic header/nav, active link `aria-current`, compact menu; web shell owns account/nav |
| RosterListModal, Select | Overlay and dismiss | Accessible dialog; focus trap, Escape, return focus, scroll lock; backdrop not sole dismissal |
| HostTabs, HostViewSwitcher | Selected local view | Tabs for local view changes; links for navigation; separate keyboard and active styling |
| StatusBadge, Skeleton | Online/offline, pulsing loading | Text+icon status; `aria-busy`; polite async message; reduced-motion static skeleton |
| List, ListItem, ParticipantRow | Dividers and rows | ul/li or table for structured data; stable IDs, empty/loading/error states; virtualization only if measured |
| Box, Dimensions | Flex and screen-derived sizes | CSS grid/flex, constrained containers, responsive gutters; no static screen widths |

Sources: files named above under `src/components/`; `src/screens/HostDashboardScreen/HostTabs.tsx`, `HostViewSwitcher.tsx`, `RosterListModal.tsx`; `src/screens/ParticipantsScreen/ParticipantRow.tsx`.

Missing proposed primitives: form error summary, checkbox/switch, numeric duration input/stepper, accessible toast, progress indicator, confirmation dialog, locale menu, tooltip, empty state and segmented mode control. Their implementation is not part of Phase 0.

## Motion, icons and responsive behavior

Extracted Input/Select label transitions are 200ms; Skeleton pulse uses 300/800ms; selector Modal fades (`src/components/Input/Input.tsx`, `src/components/Select/Select.tsx`, `src/components/Skeleton/Skeleton.tsx`). Proposed transitions: 120ms hover, 200ms dialog; disable nonessential movement for prefers-reduced-motion. No animation communicates elapsed time authoritatively.

Propose a single web outline-icon library, with Ionicons-compatible visual weight; choose and approve dependency in Phase 1. Icons are decorative when adjacent to labels and labeled when standalone. Use familiar play/pause/reset/settings symbols with tooltips; use text for explicit Save/Delete commands.

No mobile breakpoint tokens were verified. Proposed content breakpoints: compact below 640px, medium 640-1023px, wide from 1024px. These are proposals, not device detection. Timer stays primary and usable at 320px; configuration can sit alongside at wide widths and below at compact widths. Public profiles reflow their content; desktop shell navigation is not a stretched bottom bar.

## Accessibility acceptance for Phase 1+

Target WCAG 2.2 AA. Test normal text 4.5:1, large text 3:1 and meaningful control boundaries 3:1 using composited colors, not raw alpha tokens. Preserve visible focus (proposed 2px outline, 2px offset), keyboard operation, skip link, semantic landmarks, 200% zoom and 320px reflow. No color-only status, hover-only command, audio-only timer feedback or per-second screen-reader announcements. Validate both languages, reduced motion, forced colors and touch. No current compliance claim is made.
