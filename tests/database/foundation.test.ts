// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { vi } from 'vitest'

// This explicit integration suite includes Docker/CLI startup and over 60 real HTTP requests.
// Match its existing subprocess deadline without changing the unit-test timeout.
vi.setConfig({ testTimeout: 90000 })

const feature = await loadFeature('tests/bdd/database/foundation.feature')
describeFeature(feature, ({ Scenario }) => {
  Scenario('SC-205 Real database contexts enforce privacy', ({ Then }) => {
    Then(
      'local PostgreSQL and distinct REST contexts enforce the identity security contract',
      () => {
        execFileSync(process.execPath, ['scripts/test-database.mjs'], {
          stdio: 'inherit',
          timeout: 90000,
        })
      }
    )
  })
})
