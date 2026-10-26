# Proposed Phase 3A evidence exception

Status: **PROPOSED — NOT APPROVED — NOT IMPLEMENTED**. This document does not authorize acceptance, change the validator or complete a missing TDD cycle.

## Existing workflow inspection

`scripts/workflow-lib.mjs` accepts only `tdd` and `baseline` cycles. `checkEvidence` requires actual ordered RED/GREEN/REFACTOR events for TDD. `scripts/tdd.mjs` permits a baseline only before the first GREEN and with committed, clean production code. `workflow ready` also requires completed tasks and independent PASS review. `docs/PROCESS.md` contains no waiver or retrospective exception mechanism. The maintenance schema's skip_specs flag is not applicable to this behavior change. No existing CLI flag or review statement can legitimately waive the missing proof.

The validator, workflow rules, historical ledger, report bytes, timestamps and hashes remain unchanged. The active change is not ready and cannot be archived under current rules.

## Exact proposed scope

Only `phase-three-a-identity-foundation`:

1. FR-205 / SC-205: acknowledge that the original database TDD cycle was not recorded. Original blocker: unavailable Windows Docker Linux engine. SQL was prepared before real database execution. Later test-overload and harness-timeout failures are not product RED. Current migrations, 70 pgTAP assertions, real signed-JWT REST/RLS/ownership/concurrency/deletion checks and reproducible generated types provide acceptance evidence, not a reconstructed development sequence.
2. Task 1.1: acknowledge the incomplete original full preimplementation GREEN because of the existing Storybook axe race. Preserve that failed baseline; use the newly recovered current full GREEN only for present acceptance. Never rename it as the original baseline.

No exception for other scenarios, changes, future phases, security constraints, SQL grants/RLS, coverage, WCAG assertions, full verification, independent review, evidence integrity or authentication verification. SC-201–204 keep their existing TDD evidence requirements. The new axe regression's RED and GREEN are separate engineering evidence and do not fill SC-205's historical gap.

## Content-addressed historical references

`openspec/changes/phase-three-a-identity-foundation/evidence/history-manifest.json` records exact repository-relative paths, byte lengths and SHA-256 digests for 20 preserved artifacts: the original ledger and its 12 reports, both original baseline logs, the original successful application verification, the real database acceptance report/log, the type reproducibility log and generated schema types. Approval must reference these exact content hashes, not mutable path names alone. Original files remain in place; the manifest is a record of observed content, not invented test evidence.

Fresh final-recovery database reports and recovered-current verification logs must be referenced separately with their actual digests. Historical failures and the absence of original RED cannot be reconstructed honestly after implementation. Introducing a production SQL regression simply to create RED is prohibited.

## Process proposal for explicit approval

If the project owner approves this narrow exception, implement it only as an explicit, separately reviewed extension to the current workflow; this proposal alone must never make ready succeed. The owner must explicitly authorize both the policy scope and implementing its validation support.

The proposed record would identify the exact change, scenario and original baseline gap; the reason and permanent status of missing evidence; historical content digests; fresh real database acceptance, schema fingerprint/type reproducibility and recovered current full GREEN; explicit user approval; and a separate independent reviewer approval of the exception record. Preserve the original ledger. Report the status as **accepted by approved exception**, never **TDD complete** or **original GREEN obtained**.

Any implementation must have meaningful positive/negative workflow tests. Reject absent approvals, stale/mismatched evidence, wrong changes/scenarios, attempted exceptions for other requirements, fabricated phase events, failed security/WCAG/current verification, and missing independent review. Existing ordinary TDD validation remains strict. Current tasks stay incomplete until this policy is approved, its implementation reviewed and all mandatory gates legitimately pass.

## Decision requested

Approve or reject proposing this exact one-change recovery exception as the basis for a separately reviewed validator implementation. Approval is not permission to archive immediately. Without explicit approval, leave the current validator unchanged and Phase 3A active. No general waiver mode or undocumented bypass is proposed.

Independent review of the proposal and current technical evidence is requested before this decision is presented to the user. The exception itself has no user or independent approval yet.
