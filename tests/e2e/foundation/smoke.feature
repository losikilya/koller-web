Feature: Guest platform foundation
  @dance-platform-foundation @FR-001 @SC-001
  Scenario: A guest discovers the first practice tool
    Given a visitor opens the English homepage
    When they navigate to Playground
    Then they can open the Practice Timer placeholder

  @dance-platform-foundation @FR-002 @SC-002
  Scenario: A visitor changes language without losing their route
    Given a visitor is viewing the English Practice Timer route
    When they switch to Russian
    Then the equivalent route opens with Russian content
