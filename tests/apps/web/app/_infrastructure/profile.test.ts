// @vitest-environment node
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { beforeEach, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { handleProfileRequest } from '@/app/_infrastructure/profile'
const state = vi.hoisted(() => ({
  identity: true,
  code: '',
  row: true,
  writes: 0,
}))
vi.mock('@/shared/supabase/server', () => ({
  createSupabaseRequestClient: (cookies: {
    setAll?: (values: unknown[], headers: Record<string, string>) => void
  }) => {
    cookies.setAll?.(
      [{ name: 'sb-refresh', value: 'refreshed', options: { path: '/' } }],
      {}
    )
    return {
      auth: {
        getUser: async () => ({
          data: {
            user: state.identity
              ? {
                  id: '11111111-1111-4111-8111-111111111111',
                  email_confirmed_at: 'confirmed',
                }
              : null,
          },
          error: null,
        }),
      },
    }
  },
}))
vi.mock('@/modules/profile/profileRepository', () => ({
  createProfileRepository: () => ({
    read: async () =>
      state.row
        ? {
            userId: '11111111-1111-4111-8111-111111111111',
            username: null,
            displayName: '',
            bio: '',
            revision: '1',
            updatedAt: '2026-10-27T00:00:00Z',
            privacy: {
              visibility: 'private',
              discoverable: false,
              showActivity: false,
              revision: '4',
            },
          }
        : null,
    write: async () => {
      state.writes++
      return state.code ? { code: state.code } : null
    },
  }),
}))
beforeEach(() => {
  state.identity = true
  state.code = ''
  state.row = true
  state.writes = 0
  vi.stubEnv('AUTH_SITE_URL', 'http://127.0.0.1:4310')
})
function request(
  body = '{"bio":"draft"}',
  headers: Record<string, string> = {}
) {
  return new NextRequest('http://127.0.0.1:4310/api/v1/me/profile', {
    method: 'PATCH',
    headers: {
      Origin: 'http://127.0.0.1:4310',
      'Content-Type': 'application/json',
      'If-Match': '"profile-1"',
      ...headers,
    },
    body,
  })
}
const feature = await loadFeature('tests/bdd/profile/management.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-405 Enforce HTTP preconditions', ({ Then }) => {
      Then(
        'profile HTTP enforces identity origin bytes revision and safe responses',
        async () => {
          const get = await handleProfileRequest(
            new NextRequest('http://127.0.0.1:4310/api/v1/me'),
            'read'
          )
          expect(get.status).toBe(200)
          expect(get.headers.get('etag')).toBe('"profile-1"')
          expect(get.headers.get('cache-control')).toContain('no-store')
          expect(get.headers.get('set-cookie')).toContain(
            'sb-refresh=refreshed'
          )
          expect(JSON.stringify(await get.json())).not.toMatch(
            /email|avatar_path|deletion_requested_at/
          )
          for (const [body, headers, status] of [
            ['{}', { Origin: 'https://evil.test' }, 403],
            ['{}', { 'If-Match': '' }, 428],
            ['{}', { 'If-Match': 'W/"profile-1"' }, 400],
            ['{}', { 'Content-Type': 'text/plain' }, 415],
            ['{', {}, 400],
            ['{}', {}, 422],
            ['{"userId":"forged"}', {}, 422],
            ['{"bio":"' + 'я'.repeat(9000) + '"}', {}, 413],
          ] as const)
            expect(
              (await handleProfileRequest(request(body, headers), 'write'))
                .status
            ).toBe(status)
          expect(state.writes).toBe(0)
          state.identity = false
          expect((await handleProfileRequest(request(), 'write')).status).toBe(
            401
          )
          state.identity = true
          for (const [code, status] of [
            ['23505', 409],
            ['40001', 412],
            ['23514', 422],
            ['42501', 403],
            ['XX000', 503],
          ] as const) {
            state.code = code
            const response = await handleProfileRequest(request(), 'write')
            expect(response.status).toBe(status)
            expect(response.headers.get('set-cookie')).toContain(
              'sb-refresh=refreshed'
            )
            expect(response.headers.get('cache-control')).toContain('no-store')
            expect(await response.text()).not.toContain(code)
          }
          state.code = ''
          expect((await handleProfileRequest(request(), 'write')).status).toBe(
            200
          )
        }
      )
    })
  },
  { includeTags: ['SC-405'] }
)
