// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
vi.setConfig({ testTimeout: 95000 })
const feature = await loadFeature('tests/bdd/profile/completion.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario(
      'SC-421 Atomic completion and direct database protection',
      ({ Then }) => {
        Then(
          'real database completion guards and races enforce the approved public policy',
          () => {
            execFileSync(
              process.execPath,
              ['scripts/test-completion-database.mjs'],
              { stdio: 'inherit', timeout: 90000 }
            )
          }
        )
      }
    )
  },
  { includeTags: ['SC-421'] }
)
