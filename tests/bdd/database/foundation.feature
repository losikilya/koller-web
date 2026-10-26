@phase-three-a-identity-foundation
Feature: Real database identity privacy
  @FR-205 @SC-205
  Scenario: SC-205 Real database contexts enforce privacy
    Then local PostgreSQL and distinct REST contexts enforce the identity security contract
