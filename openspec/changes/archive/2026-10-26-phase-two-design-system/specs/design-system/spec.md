## Purpose

Provide reusable accessible controls and consistent presentation for the Dance Platform and future feature modules.

## ADDED Requirements

### Requirement: FR-101 Actions and inputs

Actions SHALL retain native button behavior and expose primary/secondary/ghost variants, small/medium sizes and loading state that prevents activation while preserving its accessible name. Icon actions SHALL require a name. Inputs SHALL support native controlled/uncontrolled values and associate a persistent label, description and textual error with their control.

#### Scenario: SC-101 Busy action cannot repeat

- **WHEN** an action enters loading state
- **THEN** its accessible name remains and further activation is prevented

#### Scenario: SC-102 Input communicates errors

- **WHEN** an input has a description and error
- **THEN** its label, description and error are associated with the input and its invalid state is exposed

### Requirement: FR-102 Modal and local selection

Dialogs SHALL expose a name, enter modal focus, contain keyboard focus, close on Escape or an explicitly labelled close button and restore trigger focus. Tabs SHALL connect selection to one visible panel, skip disabled choices and support ArrowLeft/Right with wrapping, Home and End. Tabs SHALL support controlled and uncontrolled selection.

#### Scenario: SC-103 Dialog dismissal

- **WHEN** a visitor opens a dialog and dismisses it
- **THEN** the close callback runs and focus returns to its trigger

#### Scenario: SC-104 Keyboard tab selection

- **WHEN** a visitor navigates tabs with arrow keys, Home and End
- **THEN** focus and selection follow enabled tabs and only the selected panel is exposed

### Requirement: FR-103 Consistent presentation

Shared cards, badges, containers, loading indicators and empty states SHALL consume central semantic tokens. Loading SHALL announce a caller-provided label and respect reduced motion. Empty states SHALL expose a title and optional description/action. Existing pages and responsive shell SHALL retain EN/RU routes, placeholders, keyboard navigation and 320px reflow with visible focus.

#### Scenario: SC-105 Feedback is understandable

- **WHEN** a caller renders loading or empty content
- **THEN** a labelled status or named empty section explains the state

### Requirement: FR-104 Isolated component examples

Storybook SHALL build examples of the public components using the same tokens and font family as the application. Examples SHALL include variants, sizes, disabled, loading, input errors, modal dismissal and keyboard tabs where applicable, without adding product routes or simulated authentication/timer features.

#### Scenario: SC-106 Inspect public component states

- **WHEN** a developer opens the component examples
- **THEN** public controls demonstrate their accessible states and interactions
