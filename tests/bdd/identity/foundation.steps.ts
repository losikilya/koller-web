import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { assertIdentityContracts } from '../../packages/contracts/identityAssertions'
import { assertPublicConfiguration } from './configAssertions'
import { assertVerifiedInitialization } from './ensureProfileAssertions'
import { expect } from 'vitest'
import { contractImportAllowed } from '../../../scripts/check-boundaries.mjs'

const feature = await loadFeature('tests/bdd/identity/foundation.feature')
describeFeature(feature, ({ Scenario }) => {
  Scenario('SC-201 Invalid identity data is rejected', ({ Then }) => {
    Then(
      'invalid identity inputs are rejected and Russian presentation text is preserved',
      assertIdentityContracts
    )
  })
  Scenario('SC-202 Privileged configuration is rejected', ({ Then }) => {
    Then(
      'only safe public configuration is accepted without leaking keys',
      assertPublicConfiguration
    )
  })
  Scenario('SC-203 Only verified callers initialize profiles', ({ Then }) => {
    Then(
      'initialization requires verified identity and reports retryable failures',
      assertVerifiedInitialization
    )
  })
  Scenario('SC-204 Zod does not weaken boundaries', ({ Then }) => {
    Then(
      'Zod is allowed while framework and infrastructure imports are rejected',
      () => {
        expect(contractImportAllowed('zod')).toBe(true)
        expect(contractImportAllowed('./identity')).toBe(true)
        for (const spec of [
          'next',
          'next/headers',
          'react',
          'node:fs',
          '@/shared/supabase/browser',
          'zod/v4',
          '@supabase/supabase-js',
        ])
          expect(contractImportAllowed(spec)).toBe(false)
      }
    )
  })
})
