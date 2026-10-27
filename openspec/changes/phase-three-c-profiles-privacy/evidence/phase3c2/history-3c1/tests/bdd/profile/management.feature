@phase-three-c-profiles-privacy
Feature: Private owner profile management
  @FR-401 @SC-401
  Scenario: SC-401 Read the owner projection
    Then only the active owner presentation and lossless revisions are returned
  @FR-402 @SC-402
  Scenario: SC-402 Save canonical presentation
    Then normalized patches save and invalid or conflicting changes fail safely
  @FR-403 @SC-405
  Scenario: SC-405 Enforce HTTP preconditions
    Then profile HTTP enforces identity origin bytes revision and safe responses
  @FR-404 @SC-418
  Scenario: SC-418 Preserve drafts and reload deliberately
    Then failed edits retain drafts and reload is explicit with owned cancellation
  @FR-405 @SC-420
  Scenario: SC-420 Existing real database guards
    Then actual PostgreSQL arbitrates simultaneous profile writes and decimal revisions
