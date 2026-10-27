// @vitest-environment node
import { expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { handleAvatarRequest } from '@/app/_infrastructure/avatar'
const { remove } = vi.hoisted(() => ({ remove: vi.fn(async () => {}) }))
vi.mock('@/shared/supabase/verifiedUser', () => ({
  readVerifiedUser: async () => ({
    id: '11111111-1111-4111-8111-111111111111',
    email_confirmed_at: 'confirmed',
  }),
}))
vi.mock('@/app/_infrastructure/requestContext', () => ({
  authOrigin: () => 'http://127.0.0.1:4310',
  responseContext: () => ({
    client: {},
    finish: (response: Response) => response,
  }),
}))
vi.mock('@/app/_infrastructure/avatarRuntime', () => ({
  createAvatarRuntime: () => ({
    remove,
    read: async () => ({
      profile: { avatarUrl: null, revision: '5' },
      etag: '"profile-5"',
    }),
  }),
}))
function request(body: Uint8Array) {
  return new NextRequest('http://127.0.0.1:4310/api/v1/me/avatar', {
    method: 'DELETE',
    headers: {
      Origin: 'http://127.0.0.1:4310',
      'If-Match': '"profile-4"',
      'X-Avatar-Operation': '22222222-2222-4222-8222-222222222222',
    },
    body: new Uint8Array(body).buffer,
  })
}
test('an empty transport stream is a valid bodyless DELETE and preserves its revision condition', async () => {
  const response = await handleAvatarRequest(
    request(new Uint8Array()),
    'remove'
  )
  expect(response.status).toBe(200)
  expect(response.headers.get('etag')).toBe('"profile-5"')
  expect(remove).toHaveBeenCalledWith(
    '22222222-2222-4222-8222-222222222222',
    '4'
  )
})
test('actual DELETE bytes are rejected before mutation', async () => {
  remove.mockClear()
  expect(
    (await handleAvatarRequest(request(new Uint8Array([1])), 'remove')).status
  ).toBe(400)
  expect(remove).not.toHaveBeenCalled()
})
