# identity-foundation Specification

## Purpose

Provide private account persistence, safe public projections and verified session infrastructure for future authentication and profile features.

## Requirements

### Requirement: FR-201 Validated identity contracts

The system SHALL validate strict profile, privacy and preferences input, nullable lowercase ASCII usernames, supported locales/themes, and version-one JSON objects bounded to 16 KiB. Persistence types SHALL remain separate from public DTOs. Avatar storage paths SHALL NOT be exposed publicly.

#### Scenario: SC-201 Invalid identity data is rejected

- **WHEN** a caller supplies invalid handles, unknown fields, private discovery, unsupported versions or oversized JSON
- **THEN** validation rejects them while valid Russian presentation text is accepted

### Requirement: FR-202 Safe public configuration

The system SHALL accept publishable keys and local-only legacy anon keys, reject privileged keys and insecure remote URLs, and fail clearly on incomplete configuration without echoing credentials. Unconfigured guest pages SHALL continue working.

#### Scenario: SC-202 Privileged configuration is rejected

- **WHEN** configuration contains secret keys, service-role JWTs or a remote legacy JWT
- **THEN** validation fails without disclosing the supplied key

### Requirement: FR-203 Verified request isolation

The system SHALL use isolated server clients and cookie refresh, verify identity before protected operations, derive bootstrap ownership from the caller JWT, propagate refresh cookies through localized responses and prevent shared caching of authenticated responses. Bootstrap errors SHALL be retryable without affecting Auth user creation.

#### Scenario: SC-203 Only verified callers initialize profiles

- **WHEN** identity verification fails or profile initialization fails
- **THEN** unauthorized initialization is prevented and initialization failures remain explicit and retryable

### Requirement: FR-204 Framework independent contracts

Shared contracts SHALL permit Zod while continuing to reject framework, browser adapter and server imports.

#### Scenario: SC-204 Zod does not weaken boundaries

- **WHEN** contracts import Zod, Next.js, React or Node infrastructure
- **THEN** only Zod and local contract imports are permitted

### Requirement: FR-205 Private database ownership

All four application tables SHALL enforce constraints, grants and RLS. Bootstrap SHALL be atomic, idempotent and private by default. Mutations SHALL derive ownership from verified JWTs. Public reads SHALL expose only approved presentation fields, require public visibility and exclude non-discoverable accounts from discovery. Auth deletion SHALL cascade owned rows.

#### Scenario: SC-205 Real database contexts enforce privacy

- **WHEN** anonymous, owner and non-owner clients access initialized accounts in local Supabase
- **THEN** constraints, JSON budgets, grants, ownership, exact public reads, discovery, bootstrap recovery and deletion are enforced by PostgreSQL and REST
