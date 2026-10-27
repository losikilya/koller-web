// @vitest-environment node
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/supabase/database'
import {
  createAvatarRuntime,
  readAvatarImage,
} from '@/app/_infrastructure/avatarRuntime'
import { avatarImage } from '../../../../helpers/avatarFixtures.mjs'
const origin = 'http://127.0.0.1:54321',
  owner = '11111111-1111-4111-8111-111111111111',
  object = '22222222-2222-4222-8222-222222222222',
  operation = '33333333-3333-4333-8333-333333333333'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  vi.unstubAllEnvs()
})
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', origin)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture')
  vi.stubEnv('LOCAL_AVATAR_SERVICE_KEY', 'local-server-fixture')
})
function client() {
  return createClient<Database>(origin, 'sb_publishable_fixture', {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
test('delivery discards fetched bytes if current authorization changes and never treats dependency failure as public access', async () => {
  const image = await avatarImage(2, 2, 'webp')
  let calls = 0
  server.use(
    http.post(
      origin + '/rest/v1/rpc/avatar_service_resolve',
      async ({ request }) => {
        const input = (await request.json()) as {
          p_id: string
          p_viewer?: string
        }
        expect(input.p_id).toBe(object)
        expect(input.p_viewer).toBeUndefined()
        calls++
        return HttpResponse.json(
          calls === 1 ? [{ owner_id: owner, object_id: object }] : []
        )
      }
    ),
    http.get(
      origin + '/storage/v1/object/profile-avatars/:owner/:file',
      () =>
        new HttpResponse(new Uint8Array(image), {
          headers: { 'Content-Type': 'image/webp' },
        })
    )
  )
  expect(await readAvatarImage(object, null)).toBeNull()
  expect(calls).toBe(2)
  server.use(
    http.post(origin + '/rest/v1/rpc/avatar_service_resolve', () =>
      HttpResponse.json(
        { message: 'private dependency details' },
        { status: 503 }
      )
    )
  )
  await expect(readAvatarImage(object, null)).rejects.toMatchObject({
    code: 'service_unavailable',
    message: 'service_unavailable',
  })
})
test('privileged local capability fails before contacting a remote provider', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  await expect(readAvatarImage(object, null)).rejects.toMatchObject({
    code: 'service_unavailable',
  })
  expect(() => createAvatarRuntime(client(), owner)).toThrow(
    'service_unavailable'
  )
})
test('actual SDK transport uses server object identity, immutable upload, decimal conditions and whitelisted owner response', async () => {
  const bytes = await avatarImage(2, 2, 'webp')
  let attached = ''
  server.use(
    http.post(origin + '/rest/v1/rpc/begin_own_avatar_upload', () =>
      HttpResponse.json('pending')
    ),
    http.post(
      origin + '/rest/v1/rpc/avatar_service_upload_object',
      async ({ request }) => {
        expect(await request.json()).toEqual({
          p_owner: owner,
          p_id: operation,
        })
        return HttpResponse.json(object)
      }
    ),
    http.post(
      origin + '/storage/v1/object/profile-avatars/:owner/:file',
      ({ request }) => {
        expect(
          new URL(request.url).pathname.endsWith('/' + object + '.webp')
        ).toBe(true)
        expect(request.headers.get('x-upsert')).toBe('false')
        return HttpResponse.json(
          {
            statusCode: '409',
            error: 'Duplicate',
            message: 'Already uploaded',
          },
          { status: 409 }
        )
      }
    ),
    http.get(
      origin + '/storage/v1/object/profile-avatars/:owner/:file',
      () =>
        new HttpResponse(new Uint8Array(bytes), {
          headers: { 'Content-Type': 'image/webp' },
        })
    ),
    http.post(
      origin + '/rest/v1/rpc/avatar_service_ready',
      () => new HttpResponse(null, { status: 204 })
    ),
    http.post(
      origin + '/rest/v1/rpc/attach_own_avatar',
      async ({ request }) => {
        const input = (await request.json()) as { p_expected_revision: string }
        attached = input.p_expected_revision
        return new HttpResponse(null, { status: 204 })
      }
    ),
    http.get(origin + '/rest/v1/profiles', () =>
      HttpResponse.json({
        user_id: owner,
        username: 'dancer',
        display_name: 'Owner',
        bio: '',
        avatar_id: object,
        avatar_path: 'private fixture locator',
        revision: '9007199254740994',
        updated_at: '2026-10-27T00:00:00Z',
        completed_at: '2026-10-27T00:00:00Z',
        deletion_requested_at: null,
      })
    ),
    http.get(origin + '/rest/v1/profile_privacy', () =>
      HttpResponse.json({
        visibility: 'public',
        discoverable: false,
        show_activity: false,
        revision: '4',
      })
    )
  )
  const runtime = createAvatarRuntime(client(), owner)
  expect(await runtime.reserve(operation, 'a'.repeat(64))).toBe('pending')
  await runtime.upload(operation, bytes)
  await runtime.ready(operation)
  await runtime.attach(operation, '9007199254740993')
  expect(attached).toBe('9007199254740993')
  const current = await runtime.read()
  expect(current.profile.avatarUrl).toBe('/api/v1/profile-avatars/' + object)
  expect(current.etag).toBe('"profile-9007199254740994"')
  expect('avatar_path' in current.profile).toBe(false)
  expect('avatarId' in current.profile).toBe(false)
  expect('completed_at' in current.profile).toBe(false)
})
