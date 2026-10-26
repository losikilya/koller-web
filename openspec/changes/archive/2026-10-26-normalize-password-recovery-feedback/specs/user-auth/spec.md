# Spec Delta

## MODIFIED Requirements

### Requirement: FR-303 Password recovery

The application SHALL provide generic recovery-request feedback regardless of account existence. A valid recovery email SHALL establish a verified session for password update; unauthenticated updates and invalid, expired or reused links SHALL fail safely. Passwords SHALL never enter application tables, logs or telemetry.

#### Scenario: SC-303 Recover and reset password

- **WHEN** a visitor requests recovery and follows its single-use email link
- **THEN** the new policy-compliant password works and the old password fails

#### Scenario: SC-309 Repeated recovery does not disclose account existence

- **WHEN** valid recovery requests are repeated for registered and absent addresses, including provider throttling, delivery errors or thrown failures
- **THEN** the application SHALL return identical generic pending feedback without provider error details, while still invoking the provider for every valid request and preserving its enforcement
- **AND** malformed input SHALL fail validation before any provider request
