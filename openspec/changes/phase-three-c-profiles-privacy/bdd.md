# Acceptance mapping

Canonical service/HTTP/editor/real SQL examples: tests/bdd/profile/management.feature. Browser navigation/focus/reflow/metadata: tests/e2e/profile/management.feature with real playwright-bdd steps. Focused Vitest drivers map each scenario; browser SC-419 also has a localized RTL driver.

SC-420 is a preimplementation baseline of existing direct SQL/RPC constraints and races, including actual decimal-string bigint transport and immediate reuse. It does not describe new UI behavior. Its focused real-local driver runs before any production stub/first GREEN. All other mapped scenarios introduce new behavior and require genuine assertion RED/GREEN/REFACTOR. Existing FR-303 recovery remains covered by unchanged regression tests in the full gate.

Review correction: initial direct Vitest assertions established the recorded behavior cycles, but did not load the unit feature. Current mapped drivers now use loadFeature/describeFeature with explicit scenario tag partitions; every unit scenario's exact Then text executes its assertions, while SC-419's browser Gherkin is executed by playwright-bdd. Original report/ledger bytes are preserved; no new baseline or retroactive Gherkin execution is claimed. The current executable-driver and real SQL run is retained in evidence/executable-bdd-and-sql.txt. Additional untagged uncertain-write and eligible publication/name-clear regressions protect findings discovered after implementation, without retroactive baseline classification.

## Revised Phase 3C.2

New executable scenarios SC-421–424 cover atomic SQL completion, route/auth-return gates, public projection/metadata and EN/RU onboarding/browser navigation. Their assertions and canonical feature drivers precede implementation; new RED cycles append without modifying original 16 events. No new baseline cycle is claimed against uncommitted 3C.1 production. A fresh full unchanged-3C.1 GREEN is retained in evidence/phase3c2/baseline.txt.
