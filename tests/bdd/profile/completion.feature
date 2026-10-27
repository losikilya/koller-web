@phase-three-c-profiles-privacy
Feature: Revised mandatory profile completion
  @FR-406 @SC-421
  Scenario: SC-421 Atomic completion and direct database protection
    Then real database completion guards and races enforce the approved public policy
  @FR-407 @SC-422
  Scenario: SC-422 Gate routes and safe auth returns
    Then incomplete routing and auth returns preserve the completion and recovery matrix
  @FR-408 @SC-423
  Scenario: SC-423 Safe public projection and metadata
    Then public lookup and metadata expose only safe unindexed current-handle content
  @FR-409 @SC-424
  Scenario: SC-424 Complete and navigate in EN and RU
    Then explicit completion requires only handle and name and preserves safe write state
