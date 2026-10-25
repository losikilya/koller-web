# Component inventory

Before Phase 2: Button and Container only; app-local Card/Badge/action-link styles. After: eleven public primitives, one shared class helper and exported prop types. Export path remains `@dance/ui`; private SCSS and component files are not public package subpaths. No React Context, application localization dependency or runtime component framework.

| Public API       | Contract / ownership                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button           | Native button props/ref; variant primary/secondary/ghost, size small/medium, loading; default type button; busy disables activation and retains name                          |
| buttonClassName  | Same variant/size options; apply to an app-owned locale-aware Link without adding Next dependency to UI                                                                       |
| IconButton       | Button props with required aria-label; decorative children; 44px target                                                                                                       |
| Input            | Native input props/ref; required id/label; optional description/error; native value/defaultValue; merges external describedby with own text                                   |
| Card             | Native article attributes/children; neutral reusable surface, no implicit click handler or route                                                                              |
| Badge            | Native span attributes; accent/neutral/danger/success tone; textual content; no automatic announcement                                                                        |
| Dialog           | Controlled open/onClose, title, closeLabel, children; native modal, Escape, explicit dismissal, focus/scroll restoration                                                      |
| Tabs             | label, readonly items `{id,label,content,disabled?}`; value/defaultValue/onValueChange; stable unique item ids required; first enabled fallback for removed/invalid selection |
| Container        | Existing div attributes/className; central responsive gutters and 1200px max width                                                                                            |
| LoadingIndicator | Required localized label; status plus decorative spinner; reduced-motion static indicator                                                                                     |
| EmptyState       | Required title, optional description/action; named section with h2, caller supplies appropriate translated content                                                            |

Dialog/Tabs are separate client files. No package-wide client directive. Button callbacks work inside a caller's client graph; event handlers cannot be passed from a Server Component. Links are styled through the helper, not simulated with buttons.

## Storybook

Run `pnpm storybook` at port 6006. Static build: `pnpm storybook:build`, output `storybook-static/`. Browser acceptance: build first, set installed browser override if needed, then `pnpm test:storybook`. Root `pnpm verify` includes both build and browser acceptance after all original gates.

Storybook 10.6.3 uses supported `@storybook/nextjs-vite` and `@storybook/addon-a11y`. Official reference: https://storybook.js.org/docs/get-started/frameworks/nextjs-vite. Registry peer metadata accepts installed React 19/Next 16/Vite 7. Manual pnpm 8 installation/build is verified; the CLI's current recommendation of pnpm 9+ did not require replacing the project's manager.

`.storybook/preview.ts` imports the same package tokens as Next globals. Both use `--font-body`; preview adds only basic box sizing/body typography, not a second palette. Story configuration and stories participate in strict typecheck/lint/format. No deprecated essentials/interactions addon, Chromatic or paid service.

`packages/ui/stories/Primitives.stories.tsx`: Default, States (all primitives, variants, sizes, disabled/error/loading), Disabled, Loading, Modal, KeyboardTabs, ControlledTabs, Focus. Names in developer examples are English; product EN/RU translations stay unchanged. Tab/focus instructions are available in Focus. Card/Badge/Container/EmptyState are demonstrated inside States rather than duplicated trivial story files.

Deferred: Select/listbox, checkbox/switch, tooltip/popover, toast/error summary, skeleton, numeric stepper, timer controls, nested dialogs, light theme and licensed Hauora. None is required by current product placeholders. No fake login form or timer interactions are added.
