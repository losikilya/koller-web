Feature: Accessible foundation controls
  @dance-platform-foundation @FR-003 @SC-003
  Scenario: Mobile navigation can be operated with a keyboard
    Given the compact navigation is closed
    When a visitor opens it and presses Escape
    Then the navigation closes and focus returns to its toggle

  @dance-platform-foundation @FR-004 @SC-004
  Scenario: Shared buttons preserve native behavior
    Given an enabled shared button
    When a visitor activates it with the keyboard
    Then its action runs once and disabling it prevents further activation
