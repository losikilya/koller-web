# User authentication delta

## Purpose

Provide accessible localized authentication and recovery while preserving verified identity, private profile defaults and public guest tools.

## ADDED Requirements

### Requirement: FR-301 Registration and confirmation

The application SHALL validate normalized email and matching policy-compliant passwords, register through the provider, and show confirmation pending without creating a profile. Single-use email verification SHALL establish a verified session; invalid, expired and reused links SHALL show a safe localized error.

#### Scenario: SC-301 Register and verify email

- **WHEN** a visitor registers and opens the captured confirmation link
- **THEN** registration remains pending until verification, which permits private profile bootstrap

### Requirement: FR-302 Verified session and protected account

The application SHALL validate login, verify identity server-side, preserve refresh cookies and localized allowlisted return paths, protect account data, and sign out the current session through a same-origin mutation. Invalid credentials and unconfirmed email SHALL receive safe non-enumerating feedback. Sensitive responses SHALL prohibit caching.

#### Scenario: SC-302 Login, account and logout

- **WHEN** a guest logs in to return to account and later logs out
- **THEN** verified account access persists through refresh and becomes protected after logout

### Requirement: FR-303 Password recovery

The application SHALL provide generic recovery-request feedback regardless of account existence. A valid recovery email SHALL establish a verified session for password update; unauthenticated updates and invalid, expired or reused links SHALL fail safely. Passwords SHALL never enter application tables, logs or telemetry.

#### Scenario: SC-303 Recover and reset password

- **WHEN** a visitor requests recovery and follows its single-use email link
- **THEN** the new policy-compliant password works and the old password fails

### Requirement: FR-304 Google PKCE authentication

The application SHALL start Google authentication through provider PKCE, exchange callback codes securely, verify identity and allow only localized internal destinations. Denial, missing/invalid codes and provider errors SHALL show safe errors. Identity association SHALL remain provider-owned with no custom merging. Live-provider verification SHALL be reported separately.

#### Scenario: SC-304 Reject unsafe callback destinations

- **WHEN** OAuth is cancelled or a callback includes an unsafe return path
- **THEN** no external redirect or false success occurs

#### Scenario: SC-308 Disabled Google remains localized

- **WHEN** Google is not enabled in application configuration
- **THEN** starting Google returns a localized unavailable state without leaving the application

### Requirement: FR-305 Recoverable private bootstrap

After verified authentication the application SHALL initialize the current identity idempotently with existing private defaults. A transient initialization failure SHALL preserve the session and offer a server-verified retry without accepting a client owner UUID or metadata permissions.

#### Scenario: SC-305 Retry bootstrap safely

- **WHEN** bootstrap fails temporarily and the authenticated user retries
- **THEN** authentication survives and the same private profile is initialized once

### Requirement: FR-306 Localized accessible authentication shell

All authentication forms, errors and states SHALL support EN/RU, semantic labels, keyboard operation, visible focus and announced feedback. Submissions SHALL prevent duplicates and expose loading/disabled states. Navigation SHALL reflect verified identity without a second persistent auth store; existing authenticated users SHALL leave login/register for account.

#### Scenario: SC-306 Accessible Russian authentication

- **WHEN** a Russian visitor uses authentication by keyboard
- **THEN** localized controls and feedback are accessible and the session-aware navigation updates
