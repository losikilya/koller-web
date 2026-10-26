@phase-three-a-identity-foundation
Feature: Identity foundation contracts
  @FR-201 @SC-201
  Scenario: SC-201 Invalid identity data is rejected
    Then invalid identity inputs are rejected and Russian presentation text is preserved

  @FR-202 @SC-202
  Scenario: SC-202 Privileged configuration is rejected
    Then only safe public configuration is accepted without leaking keys

  @FR-203 @SC-203
  Scenario: SC-203 Only verified callers initialize profiles
    Then initialization requires verified identity and reports retryable failures

  @FR-204 @SC-204
  Scenario: SC-204 Zod does not weaken boundaries
    Then Zod is allowed while framework and infrastructure imports are rejected
