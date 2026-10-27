@phase-three-c-profiles-privacy @FR-404 @SC-419
Feature: Localized owner profile routes
  Scenario: SC-419 Use localized owner routes
    Given a verified profile owner
    When the owner edits their profile and switches locale
    Then the localized owner route remains accessible and private
