Feature: Accessible shared controls
  @phase-two-design-system @FR-101 @SC-101
  Scenario: SC-101 Busy action prevents repeat activation
    Then a busy action preserves its name and prevents activation

  @phase-two-design-system @FR-101 @SC-102
  Scenario: SC-102 Input explains invalid data
    Then an input associates its label description and error

  Scenario: SC-103 Dialog offers explicit dismissal
    Then a named dialog notifies its owner when dismissed

  Scenario: SC-104 Tabs support keyboard selection
    Then keyboard selection skips disabled tabs and exposes one panel

  @phase-two-design-system @FR-103 @SC-105
  Scenario: SC-105 Feedback explains missing content
    Then feedback exposes a labelled status and empty section

  @phase-two-design-system @FR-104 @SC-106
  Scenario: SC-106 Examples demonstrate component states
    Then component examples demonstrate busy disabled and error states
