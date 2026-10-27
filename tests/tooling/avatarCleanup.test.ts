// @vitest-environment node
import { expect, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { runAvatarCleanup } from '../../scripts/avatar-cleanup-worker.mjs'
const feature = await loadFeature('tests/bdd/profile/avatars.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-430 Restart durable cleanup safely', ({ Then }) => {
      Then(
        'a new cleanup worker retries durable failures with fenced acknowledgments',
        async () => {
          let pending = true,
            first = true
          const rpc = vi.fn(
            async (
              name: string,
              input?: { p_success?: boolean; p_lease?: string }
            ) => {
              if (name === 'avatar_service_claim_cleanup')
                return {
                  data: pending
                    ? [
                        {
                          id: '11111111-1111-4111-8111-111111111111',
                          object_id: '44444444-4444-4444-8444-444444444444',
                          owner_id: '22222222-2222-4222-8222-222222222222',
                          lease_token: '33333333-3333-4333-8333-333333333333',
                        },
                      ]
                    : [],
                  error: null,
                }
              if (name === 'avatar_service_cleanup_authorized')
                return { data: true, error: null }
              if (name === 'avatar_service_finish_cleanup') {
                expect(input?.p_lease).toBe(
                  '33333333-3333-4333-8333-333333333333'
                )
                if (input?.p_success) pending = false
                return { data: true, error: null }
              }
              return { data: null, error: null }
            }
          )
          const client = {
            rpc,
            storage: {
              from: () => ({
                remove: async () => {
                  if (first) {
                    first = false
                    return { error: { status: 503 } }
                  }
                  return { error: null }
                },
              }),
            },
          }
          expect(await runAvatarCleanup(client)).toMatchObject({
            claimed: 1,
            failed: 1,
            deleted: 0,
          })
          expect(pending).toBe(true)
          expect(await runAvatarCleanup(client)).toMatchObject({
            claimed: 1,
            failed: 0,
            deleted: 1,
          })
          expect(pending).toBe(false)
        }
      )
    })
  },
  { includeTags: ['SC-430'] }
)
