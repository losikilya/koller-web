# Acceptance mapping

Canonical features: tests/bdd/identity/foundation.feature and tests/bdd/database/foundation.feature.

SC-201 through SC-204 use focused Vitest drivers and executable vitest-cucumber steps. SC-205 uses tests/database/foundation.test.ts in a separate explicit database configuration: it invokes real pgTAP and REST clients. No missing daemon, command failure or connection failure counts as RED. Recovery acceptance now passes against real local Supabase, recorded in evidence/acceptance/database.json separately from the TDD ledger. SC-205's historical RED/GREEN/REFACTOR remains missing; do not relabel passing acceptance as TDD. No baseline scenarios; the original partial unchanged-product baseline and its axe failure are preserved separately.
