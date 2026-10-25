@phase-two-design-system @FR-102
Feature: Browser interaction with shared controls
  @SC-103
  Scenario: Native modal contains and restores keyboard focus
    Given the modal component example is open
    When I open the dialog and navigate its controls
    Then Escape closes the dialog and restores trigger focus

  @SC-104
  Scenario: Local tabs support keyboard selection
    Given the keyboard tabs example is open
    When I navigate enabled tabs with the keyboard
    Then only the selected panel is exposed
