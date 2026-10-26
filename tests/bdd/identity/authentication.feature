Feature: Verified localized authentication
  @phase-three-b-authentication @FR-301 @SC-301
  Scenario: SC-301 Registration waits for verification
    Then the 301 authentication contract is enforced

  @phase-three-b-authentication @FR-302 @SC-302
  Scenario: SC-302 Verified login and local logout
    Then the 302 authentication contract is enforced

  @phase-three-b-authentication @FR-303 @SC-303
  Scenario: SC-303 Generic recovery and protected reset
    Then the 303 authentication contract is enforced

  @phase-three-b-authentication @FR-304 @SC-304
  Scenario: SC-304 Safe OAuth callback and destinations
    Then the 304 authentication contract is enforced

  @phase-three-b-authentication @FR-305 @SC-305
  Scenario: SC-305 Bootstrap failure preserves session
    Then the 305 authentication contract is enforced

  @phase-three-b-authentication @FR-306 @SC-306
  Scenario: SC-306 Localized accessible submission states
    Then the 306 authentication contract is enforced

  @phase-three-b-authentication @FR-001 @SC-307
  Scenario: SC-307 Guest identity routes offer real forms
    Then the 307 authentication contract is enforced

