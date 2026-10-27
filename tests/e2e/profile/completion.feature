@phase-three-c-profiles-privacy @FR-409 @SC-425
Feature: Mandatory completion and unindexed public profiles
  Scenario: SC-425 Refresh and manual navigation cannot bypass completion
    Given a new authenticated incomplete account
    When the account attempts refresh manual and history navigation before completing
    And the owner explicitly completes the public profile
    Then public EN and RU profile pages are safe accessible unindexed SSR
