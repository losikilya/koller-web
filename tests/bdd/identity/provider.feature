Feature: Provider availability
  @phase-three-b-authentication @FR-304 @SC-308
  Scenario: SC-308 Disabled Google remains in the localized application
    Then disabled Google returns a safe application error before redirect

