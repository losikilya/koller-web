@phase-three-c-profiles-privacy @FR-413
Feature: Localized optional avatar management
  @SC-431
  Scenario: SC-431 Manage avatars in real EN and RU pages
    Given a completed owner without an avatar
    When the owner rejects oversized photos and replaces an uploaded avatar
    Then current EN and RU public images are safe and old avatar URLs are unavailable
