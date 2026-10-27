@phase3c-integration
Feature: Combined local profile acceptance
  Existing completion, editing and avatar contracts work together without new product behavior.

  Scenario Outline: An optional avatar follows completion and username reuse
    Given an incomplete integration owner opens the <locale> profile
    When the owner uploads an optional avatar before completing the profile
    And the owner completes and renames the profile while another owner reuses the old name
    Then public localized pages preserve identity avatar privacy and safe presentation

    Examples:
      | locale |
      | en     |
      | ru     |

  Scenario: Another editor cannot overwrite an avatar revision with a stale text draft
    Given two integration editors share one completed owner revision
    When one editor uploads a photo and the other saves a stale text draft
    Then the draft survives the conflict and explicit reload permits a current save
