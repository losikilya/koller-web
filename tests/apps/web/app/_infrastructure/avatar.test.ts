// @vitest-environment node
import { beforeEach, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import {
  AVATAR_MAX_FILE_BYTES,
  AVATAR_MAX_REQUEST_BYTES,
} from '@dance/contracts'
import {
  handleAvatarRequest,
  handleAvatarImage,
} from '@/app/_infrastructure/avatar'
const state = vi.hoisted(() => ({ authenticated: true, revision: '' }))
const id = '11111111-1111-4111-8111-111111111111'
const profile = {
  userId: id,
  username: 'dancer',
  displayName: 'Owner',
  bio: '',
  avatarUrl: '/api/v1/profile-avatars/' + id,
  completed: true,
  revision: '9007199254740994',
  updatedAt: '2026-10-27T00:00:00Z',
  privacy: {
    visibility: 'public',
    discoverable: false,
    showActivity: false,
    revision: '2',
  },
}
vi.mock('@/shared/supabase/verifiedUser', () => ({
  readVerifiedUser: async () =>
    state.authenticated
      ? {
          id: '11111111-1111-4111-8111-111111111111',
          email_confirmed_at: 'confirmed',
        }
      : null,
}))
vi.mock('@/app/_infrastructure/requestContext', () => ({
  authOrigin: () => 'http://127.0.0.1:4310',
  responseContext: () => ({
    client: {},
    finish: (response: Response) => response,
  }),
}))
vi.mock('@/app/_infrastructure/avatarRuntime', () => ({
  createAvatarRuntime: () => ({}),
  readAvatarImage: async (value: string) =>
    value === '11111111-1111-4111-8111-111111111111'
      ? new Uint8Array([82, 73, 70, 70])
      : null,
}))
vi.mock('@/modules/profile', async (original) => ({
  ...(await original<typeof import('@/modules/profile')>()),
  saveAvatar: async (_deps: unknown, input: { revision: string }) => {
    state.revision = input.revision
    return { profile, etag: '"profile-9007199254740994"' }
  },
  removeAvatar: async () => ({
    profile: { ...profile, avatarUrl: null },
    etag: '"profile-9007199254740994"',
  }),
}))
beforeEach(() => {
  state.authenticated = true
  state.revision = ''
})
function request(size = 8, headers: Record<string, string> = {}) {
  const form = new FormData()
  form.set(
    'file',
    new File([new Uint8Array(size)], 'photo.png', { type: 'image/png' })
  )
  return new NextRequest('http://127.0.0.1:4310/api/v1/me/avatar', {
    method: 'POST',
    headers: {
      Origin: 'http://127.0.0.1:4310',
      'If-Match': '"profile-9007199254740993"',
      'X-Avatar-Operation': id,
      ...headers,
    },
    body: form,
  })
}
const feature = await loadFeature('tests/bdd/profile/avatars.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario(
      'SC-428 Protect avatar transport and current delivery',
      ({ Then }) => {
        Then(
          'avatar HTTP validates ownership origin bytes and conditions without leaking locators',
          async () => {
            const success = await handleAvatarRequest(request(), 'upload')
            expect(success.status).toBe(200)
            expect(success.headers.get('etag')).toBe(
              '"profile-9007199254740994"'
            )
            expect(state.revision).toBe('9007199254740993')
            expect(await success.json()).toEqual({ profile })
            expect(success.headers.get('cache-control')).toContain('no-store')
            expect(success.headers.get('x-robots-tag')).toBe(
              'noindex, nofollow'
            )
            expect(
              (
                await handleAvatarRequest(
                  request(8, { Origin: 'https://evil.test' }),
                  'upload'
                )
              ).status
            ).toBe(403)
            expect(
              (
                await handleAvatarRequest(
                  request(8, { 'If-Match': '' }),
                  'upload'
                )
              ).status
            ).toBe(428)
            expect(
              (
                await handleAvatarRequest(
                  request(8, { 'X-Avatar-Operation': 'bad' }),
                  'upload'
                )
              ).status
            ).toBe(400)
            expect(
              (
                await handleAvatarRequest(
                  request(AVATAR_MAX_FILE_BYTES + 1),
                  'upload'
                )
              ).status
            ).toBe(413)
            expect(
              (
                await handleAvatarRequest(
                  request(8, {
                    'Content-Length': String(AVATAR_MAX_REQUEST_BYTES + 1),
                  }),
                  'upload'
                )
              ).status
            ).toBe(413)
            state.authenticated = false
            expect(
              (await handleAvatarRequest(request(), 'upload')).status
            ).toBe(401)
            const image = await handleAvatarImage(
              new NextRequest(
                'http://127.0.0.1:4310/api/v1/profile-avatars/' + id
              ),
              id
            )
            expect(image.status).toBe(200)
            expect(image.headers.get('content-type')).toBe('image/webp')
            expect(image.headers.get('cache-control')).toContain('no-store')
            expect(image.headers.get('x-robots-tag')).toBe('noindex, nofollow')
            expect(
              (
                await handleAvatarImage(
                  new NextRequest(
                    'http://127.0.0.1:4310/api/v1/profile-avatars/old'
                  ),
                  '22222222-2222-4222-8222-222222222222'
                )
              ).status
            ).toBe(404)
          }
        )
      }
    )
  },
  { includeTags: ['SC-428'] }
)
