# Acceptance mapping

Canonical service/HTTP/editor/real SQL examples: tests/bdd/profile/management.feature. Browser navigation/focus/reflow/metadata: tests/e2e/profile/management.feature with real playwright-bdd steps. Focused Vitest drivers map each scenario; browser SC-419 also has a localized RTL driver.

SC-420 is a preimplementation baseline of existing direct SQL/RPC constraints and races, including actual decimal-string bigint transport and immediate reuse. It does not describe new UI behavior. Its focused real-local driver runs before any production stub/first GREEN. All other mapped scenarios introduce new behavior and require genuine assertion RED/GREEN/REFACTOR. Existing FR-303 recovery remains covered by unchanged regression tests in the full gate.

Review correction: initial direct Vitest assertions established the recorded behavior cycles, but did not load the unit feature. Current mapped drivers now use loadFeature/describeFeature with explicit scenario tag partitions; every unit scenario's exact Then text executes its assertions, while SC-419's browser Gherkin is executed by playwright-bdd. Original report/ledger bytes are preserved; no new baseline or retroactive Gherkin execution is claimed. The current executable-driver and real SQL run is retained in evidence/executable-bdd-and-sql.txt. Additional untagged uncertain-write and eligible publication/name-clear regressions protect findings discovered after implementation, without retroactive baseline classification.

## Revised Phase 3C.2

New executable scenarios SC-421–424 cover atomic SQL completion, route/auth-return gates, public projection/metadata and EN/RU onboarding/browser navigation. Their assertions and canonical feature drivers precede implementation; new RED cycles append without modifying original 16 events. No new baseline cycle is claimed against uncommitted 3C.1 production. A fresh full unchanged-3C.1 GREEN is retained in evidence/phase3c2/baseline.txt.

## Phase 3C.3 executable mapping

SC-426–430: tests/bdd/profile/avatars.feature, with focused decoder, injected durable use-case, transport, UI and cleanup-worker drivers. SC-431: tests/e2e/profile/avatars.feature with real local browser steps and a focused UI driver. Real Storage/database/worker tests run independently in root verify; they are not replaced by protocol mocks. Every new scenario records genuine RED/GREEN/REFACTOR; postimplementation regressions remain ordinary tests. No original event/report is rewritten.

## Phase 3C.4 acceptance of existing behavior

`tests/e2e/profile/integration.feature` and adjacent steps add ordinary browser acceptance for avatar-before-completion/rename/reuse (EN/RU outline) and a real stale editor after another tab's avatar write. They have no change/FR/SC tags and introduce no new contract. `evidence/phase3c4/acceptance-map.json` links them to the original 17 scenarios and FR-401–414. Original test-plan mappings and all 51 ledger events/reports stay unchanged. These joins run genuinely GREEN; no retroactive RED/baseline is fabricated. A discovered defect must be separately reproduced before a fix. Existing full root commands continue exercising real DB/Auth/Storage/worker/race and browser/a11y acceptance.
