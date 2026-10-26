@normalize-password-recovery-feedback @FR-303
Feature: Non-enumerating password recovery
  @SC-309
  Scenario: SC-309 Repeated recovery has identical public feedback
    Then repeated recovery and provider failures do not disclose account existence
