// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { test, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
vi.setConfig({ testTimeout: 95000 })
const feature = await loadFeature('tests/bdd/profile/management.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-420 Existing real database guards', ({ Then }) => {
      Then(
        'actual PostgreSQL arbitrates simultaneous profile writes and decimal revisions',
        () => {
          execFileSync(
            process.execPath,
            ['scripts/test-profile-database.mjs'],
            { stdio: 'inherit', timeout: 90000 }
          )
        }
      )
    })
  },
  { includeTags: ['SC-420'] }
)
test('a real publication/name-clear race starts eligible and preserves the public-name invariant', () => {
  execFileSync(
    process.execPath,
    ['scripts/test-profile-publication-race.mjs'],
    { stdio: 'inherit', timeout: 90000 }
  )
})
