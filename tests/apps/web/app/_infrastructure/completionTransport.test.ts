// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { handleProfileRequest } from '@/app/_infrastructure/profile'
const state = vi.hoisted(() => ({
  authenticated: true,
  code: '',
  completed: true,
  complete: vi.fn(),
}))
vi.mock('@/modules/profile/completionService', () => ({
  readCompletion: async () => state.completed,
}))
vi.mock('@/shared/supabase/server', () => ({
  createSupabaseRequestClient: () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: state.authenticated
            ? {
                id: '11111111-1111-4111-8111-111111111111',
                email_confirmed_at: 'confirmed',
              }
            : null,
        },
        error: null,
      }),
    },
  }),
}))
vi.mock('@/modules/profile/profileRepository', () => ({
  createProfileRepository: () => ({
    read: async () => ({
      userId: '11111111-1111-4111-8111-111111111111',
      username: 'dancer',
      displayName: 'Owner',
      bio: '',
      completed: true,
      revision: '3',
      updatedAt: '2026-10-27T00:00:00Z',
      privacy: {
        visibility: 'public',
        discoverable: false,
        showActivity: false,
        revision: '4',
      },
    }),
    complete: state.complete,
  }),
}))
beforeEach(() => {
  vi.stubEnv('AUTH_SITE_URL', 'http://127.0.0.1:4310')
  state.code = ''
  state.authenticated = true
  state.complete
    .mockReset()
    .mockImplementation(async () => (state.code ? { code: state.code } : null))
})
test('minimal session state returns a safe guest response while owner profile data stays protected', async () => {
  state.authenticated = false
  const response = await handleProfileRequest(
    new NextRequest('http://127.0.0.1:4310/api/v1/me/completion'),
    'completion-state'
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    authenticated: false,
    completed: false,
  })
  expect(
    (
      await handleProfileRequest(
        new NextRequest('http://127.0.0.1:4310/api/v1/me'),
        'read'
      )
    ).status
  ).toBe(401)
})
function post(
  body: unknown = { username: 'Dancer', displayName: 'Owner' },
  headers: Record<string, string> = {}
) {
  return new NextRequest('http://127.0.0.1:4310/api/v1/me/profile/complete', {
    method: 'POST',
    headers: {
      Origin: 'http://127.0.0.1:4310',
      'Content-Type': 'application/json',
      'If-Match': '"profile-9007199254740993"',
      'If-Match-Privacy': '"privacy-9223372036854775806"',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}
test('completion HTTP requires both lossless conditions, strict mandatory fields and same origin', async () => {
  for (const [body, headers, status] of [
    [
      { username: 'dancer', displayName: 'Owner' },
      { Origin: 'https://evil.test' },
      403,
    ],
    [
      { username: 'dancer', displayName: 'Owner' },
      { 'If-Match-Privacy': '' },
      428,
    ],
    [
      { username: 'dancer', displayName: 'Owner' },
      { 'If-Match-Privacy': 'W/"privacy-1"' },
      400,
    ],
    [{ username: 'dancer', displayName: '\t\u00a0\u2003' }, {}, 422],
    [{ username: 'dancer', displayName: 'Owner', completed: true }, {}, 422],
  ] as const)
    expect(
      (await handleProfileRequest(post(body, headers), 'complete')).status
    ).toBe(status)
  expect(state.complete).not.toHaveBeenCalled()
  const success = await handleProfileRequest(post(), 'complete')
  expect(success.status).toBe(200)
  expect(state.complete).toHaveBeenCalledWith(
    '11111111-1111-4111-8111-111111111111',
    { username: 'dancer', displayName: 'Owner' },
    '9007199254740993',
    '9223372036854775806'
  )
  expect(success.headers.get('etag')).toBe('"profile-3"')
  expect(success.headers.get('cache-control')).toContain('no-store')
  for (const [code, status] of [
    ['23505', 409],
    ['40001', 412],
    ['23514', 422],
  ] as const) {
    state.code = code
    expect((await handleProfileRequest(post(), 'complete')).status).toBe(status)
  }
})
