Feature: Real local authentication
  Scenario Outline: Register, confirm, recover and retain localized identity
    Given a guest opens the <locale> registration form
    When they register and verify their email through local Mailpit
    Then their account and header reflect a verified session after refresh
    When they log out and log back in to their protected account
    Then they can recover their password through local Mailpit

    Examples:
      | locale |
      | en     |
      | ru     |

