# ADR 0006 — Local profile avatar capability and cleanup

Status: Accepted for local Phase 3C.3, 2026-10-27.

Extend Profile and app-owned server adapters with bounded optional avatars, private Storage and durable cleanup. Preserve ADR 0004/0005 UUID identity, completion/publication, ownership and independent revision principles. No new backend or Identity redesign.

Contracts own exact shared limits; app infrastructure owns Node-only sharp and narrow local Storage capability; Profile owns injected use cases/UI. Browser graphs never receive privileged credentials. A private operation ledger distinguishes idempotent commit outcome from object lifecycle. Mutations lock profiles before ledger; terminal cleanup and fenced leases prevent resurrection/current-object deletion.

Controlled opaque image URLs reauthorize current eligibility before delivery and after Storage read. Existing four-column SQL presentation projections remain; eligible avatar ID is separate. No paths, signed URLs, optimizer or shared cache.

Pending expiry is 24 hours; successful cleanup retention is seven days after confirmed deletion. Failed work stays durable. Authenticated local worker reconciles crashes/late objects and deletes through Storage API only. Production scheduling/keys/monitoring require separate approval and are not certified by local acceptance.

Consequences: additive reviewed local migration/Storage enablement, compatible direct decoder dependency and real database/Storage/browser acceptance. No reset, external settings, account-deletion orchestration or arbitrary media expansion.

Client operation IDs and independently server-generated object UUIDs are distinct. Replay is guaranteed for retained operation records, including seven days after successful cleanup; after pruning a fresh current revision is required and any new operation always has a new object UUID. Old image URLs cannot revive, without indefinite tombstone retention.
