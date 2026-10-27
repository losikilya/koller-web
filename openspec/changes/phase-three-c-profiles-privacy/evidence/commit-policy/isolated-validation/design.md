# Design

## ADR impact

NONE: documentation/agent instructions only; application contracts and all accepted domain decisions remain unchanged.

The canonical .opencode command and skill define a factual summary followed by an OpenSpec Change block. Do not require or fabricate a Jira identifier. An already explicit authorization covers the current approved operation; every later commit or push requires a new explicit user request. No blanket future consent or automatic push. Preserve real review/verification and staged scope inspection.

Use a detached temporary worktree at the real precommit HEAD to isolate the maintenance allowlist from the reviewed uncommitted 3C product diff. No synthetic commit is created. The standard maintenance runner fingerprints and scope-checks this isolated patch. Its identical baseline/final plan explicitly runs the complete application gate in the original workspace containing the approved 3C.2 source and real local migration, and agent consistency in the isolated checkout. Changes are mirrored to the original workspace only after the original GREEN. State both roots in provenance; the isolated hash does not pretend to be the product workspace hash.

Retain this isolated validation package under the owning active phase-three-c-profiles-privacy change's evidence/commit-policy directory. It is evidence of isolated maintenance validation, not a native archive or a claim that mixed product changes passed the maintenance allowlist. Do not create a second active product change or edit unrelated maintenance. Validate current product acceptance digests independently. Keep all original manifests; append a supplemental commit-preparation manifest for changed current instructions/docs and isolated reports.

Rollback, if needed, restores only this explicit policy patch and generated adapters. Never reset user work or rewrite old reports. Stage with command-local core.autocrlf=false and compare staged blob bytes against original evidence before the one approved commit; do not change Git configuration.
