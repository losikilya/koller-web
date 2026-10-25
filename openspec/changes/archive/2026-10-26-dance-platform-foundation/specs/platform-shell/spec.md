# Platform shell delta

## Purpose

Provide a localized, accessible public entry point to the Dance Platform and its future guest practice tools.

## ADDED Requirements

### Requirement: FR-001 Guest route discovery

The platform SHALL expose Home, Playground, Practice Timer, Login and Register in both locales without authentication. Timer and identity pages SHALL clearly explain their placeholder status and SHALL provide no fake controls or forms.

#### Scenario: SC-001 Guest discovers Practice Timer

- **WHEN** a visitor opens the English homepage and follows Playground and Practice Timer links
- **THEN** the Practice Timer placeholder opens without requiring login

### Requirement: FR-002 Locale continuity

The platform SHALL redirect / to /en independently of browser language, preserve supported routes when switching between en and ru, localize metadata and UI, and return 404 for unknown locales and unsupported routes.

#### Scenario: SC-002 Equivalent Russian route

- **WHEN** a visitor switches from English Practice Timer to Russian
- **THEN** /ru/playground/practice-timer opens with Russian content

### Requirement: FR-003 Accessible responsive navigation

The shell SHALL provide landmarks, a skip link, visible focus, localized navigation and compact navigation operable by keyboard with Escape dismissal and focus restoration. Content SHALL reflow at 320px without horizontal scrolling.

#### Scenario: SC-003 Compact keyboard navigation

- **WHEN** a visitor opens compact navigation then presses Escape
- **THEN** it closes and focus returns to its toggle

### Requirement: FR-004 Native shared controls

Shared buttons SHALL have accessible names, native keyboard activation, safe default button type and native disabled behavior.

#### Scenario: SC-004 Disabled action

- **WHEN** a visitor activates an enabled button and then attempts activation while disabled
- **THEN** the action runs only for enabled activation
