// @vitest-environment node
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createProfileRepository } from '@/modules/profile/profileRepository'
import { saveOwnProfile, completeOwnProfile } from '@/modules/profile'
import type { Database } from '@/shared/supabase/database'

const origin = 'http://127.0.0.1:54321'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

for (const operation of ['write', 'complete'] as const) {
  for (const [sqlCode, expected] of [
    ['40001', { code: 'revision_conflict', status: 412 }],
    ['XX000', { code: 'outcome_unknown', status: 503 }],
  ] as const) {
    test(`${operation} distinguishes definite SQL rollback ${sqlCode} from an uncertain HTTP 500`, async () => {
      let calls = 0
      server.use(
        http.post(
          `${origin}/rest/v1/rpc/${
            operation === 'write'
              ? 'update_own_profile'
              : 'complete_own_profile'
          }`,
          () => {
            calls++
            return HttpResponse.json(
              {
                code: sqlCode,
                message: 'Provider detail must not reach callers',
              },
              { status: 500 }
            )
          }
        )
      )
      const client = createClient<Database>(origin, 'sb_publishable_fixture', {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const repository = createProfileRepository(client)
      const id = '11111111-1111-4111-8111-111111111111'
      const result =
        operation === 'write'
          ? saveOwnProfile(
              repository,
              id,
              { bio: 'Keep draft' },
              '9007199254740993'
            )
          : completeOwnProfile(
              repository,
              id,
              { username: 'dancer', displayName: 'Owner' },
              '9007199254740993',
              '1'
            )
      await expect(result).rejects.toMatchObject(expected)
      expect(calls).toBe(1)
    })
  }
}
