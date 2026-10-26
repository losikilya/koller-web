# Acceptance mapping

Canonical executable Gherkin: tests/bdd/identity/authentication.feature. Mirrored Vitest drivers use describeFeature for SC-301–305 and UI drivers for SC-306–307. Provider fixtures prove orchestration, not real security. Separate tests/database/authentication.test.ts and browser authentication journeys must run against local Auth and captured Mailpit mail. Existing guest Timer and Storybook checks remain regressions. No baseline scenario is reclassified as a new RED. Live Google is explicitly unverified without real credentials.

Review correction SC-308: tests/bdd/identity/provider.feature and the mirrored Next adapter driver record an additional genuine RED/GREEN/REFACTOR for disabled Google availability. The same test checks explicit enabled configuration reaches the SDK-controlled authorize URL.
