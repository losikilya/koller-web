@phase-three-c-profiles-privacy
Feature: Optional local private avatar lifecycle
  @FR-410 @SC-426
  Scenario: SC-426 Validate exact file and decoder boundaries
    Then bounded static images become metadata-free WebP and invalid content is rejected

  @FR-411 @SC-427
  Scenario: SC-427 Associate and compensate revisioned avatars
    Then avatar association preserves the current pointer across conflicts and uncertain outcomes

  @FR-412 @SC-428
  Scenario: SC-428 Protect avatar transport and current delivery
    Then avatar HTTP validates ownership origin bytes and conditions without leaking locators

  @FR-413 @SC-429
  Scenario: SC-429 Reject oversized selection before network
    Then exact file boundaries and localized feedback preserve drafts and release previews

  @FR-414 @SC-430
  Scenario: SC-430 Restart durable cleanup safely
    Then a new cleanup worker retries durable failures with fenced acknowledgments
