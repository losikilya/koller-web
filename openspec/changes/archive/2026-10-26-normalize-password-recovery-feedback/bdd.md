# BDD mapping

Canonical feature: tests/bdd/identity/recovery.feature, FR-303 / SC-309, owned by normalize-password-recovery-feedback.

Focused driver: tests/apps/web/modules/identity/recovery.test.ts. Unit-level provider responses exercise the actual public recovery service without React or network timing. The assertion compares first and repeated requests for registered/absent emails, including the per-address cooldown responsible for P2. Additional partitions cover returned/thrown provider failures and invalid input. Existing real Auth/Mailpit and browser recovery journeys remain in full verify.

The pre-fix original unit suite passed (55 tests). The sandbox loader failure is not RED evidence. The new scenario must record a behavior assertion RED before production edits, followed by unchanged-test GREEN/REFACTOR.
