# Proposal

## Why

Password recovery exposes a different public result when a registered address hits the provider's email cooldown. This violates FR-303 and allows address enumeration through repeated requests.

## What Changes

- Clarify FR-303: valid recovery requests have identical public pending feedback for success, absent accounts, provider throttling and delivery failures.
- Keep input validation and actual provider enforcement; add an executable regression and recorded RED/GREEN/REFACTOR.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-auth`: FR-303 explicitly covers repeated requests and provider failures without exposing account existence.

## Impact

Identity recovery service and focused regression tests only. No dependency, HTTP, database, provider configuration or architecture change. Existing Phase 3B archive remains byte-preserved. No commit or push.
