// @vitest-environment node
import { beforeEach, afterEach, expect, test, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { NextRequest } from 'next/server'
import { createSupabaseRequestClient } from '@/shared/supabase/server'
import { handleAuthPost, handleAuthCallback } from '@/app/_infrastructure/auth'
vi.mock('@/modules/profile/completionService', () => ({
  readCompletion: async () => {
    if (state.completionFailed) throw new Error('private provider detail')
    return true
  },
}))
const state = vi.hoisted(() => ({
  cookies: null as Parameters<typeof createSupabaseRequestClient>[0] | null,
  failVerify: false,
  googleCalls: 0,
  completionFailed: false,
}))
vi.mock('@/shared/supabase/server', () => ({
  createSupabaseRequestClient: vi.fn(
    (cookies: Parameters<typeof createSupabaseRequestClient>[0]) => {
      state.cookies = cookies
      const write = () =>
        cookies.setAll?.(
          [
            {
              name: 'sb-test-session',
              value: 'fixture-session',
              options: { path: '/', sameSite: 'lax' },
            },
          ],
          { 'Cache-Control': 'private, no-store', Expires: '0' }
        )
      return {
        auth: {
          signInWithOAuth: async () => {
            state.googleCalls++
            write()
            return {
              data: {
                url: 'http://127.0.0.1:54321/auth/v1/authorize?provider=google',
              },
              error: null,
            }
          },
          signInWithPassword: async () => {
            write()
            return { error: null }
          },
          getUser: async () => ({
            data: {
              user: {
                id: 'fixture-id',
                email_confirmed_at: 'confirmed',
                email: 'fixture@example.test',
              },
            },
            error: null,
          }),
          verifyOtp: async () => {
            write()
            return { error: state.failVerify ? { code: 'otp_expired' } : null }
          },
          signOut: async () => {
            cookies.setAll?.(
              [
                {
                  name: 'sb-test-session',
                  value: '',
                  options: { path: '/', maxAge: 0 },
                },
              ],
              {}
            )
            return { error: null }
          },
        },
        rpc: async () => ({ error: null }),
      }
    }
  ),
}))
beforeEach(() => {
  vi.stubEnv('AUTH_SITE_URL', 'http://127.0.0.1:4310')
  state.failVerify = false
  state.googleCalls = 0
  state.cookies = null
  state.completionFailed = false
})
function post(origin: string | undefined, body: unknown) {
  return new NextRequest('http://127.0.0.1:4310/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
  })
}
test('successful login preserves session cookies when completion lookup becomes unavailable', async () => {
  state.completionFailed = true
  const response = await handleAuthPost(
    post('http://127.0.0.1:4310', {
      locale: 'ru',
      email: 'fixture@example.test',
      password: 'Password123!',
    }),
    'login'
  )
  expect(await response.json()).toEqual({
    status: 'error',
    error: 'unavailable',
  })
  expect(response.cookies.get('sb-test-session')?.value).toBe('fixture-session')
  expect(response.headers.get('cache-control')).toContain('no-store')
})
test('same-origin login preserves provider cookies and no-store headers with an allowlisted return', async () => {
  const response = await handleAuthPost(
    post('http://127.0.0.1:4310', {
      locale: 'ru',
      email: 'fixture@example.test',
      password: 'Password123!',
      next: 'https://evil.test',
    }),
    'login'
  )
  expect(await response.json()).toMatchObject({
    status: 'success',
    url: '/ru/account',
  })
  expect(response.cookies.get('sb-test-session')?.value).toBe('fixture-session')
  expect(response.headers.get('Cache-Control')).toContain('no-store')
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
  expect(response.headers.get('Expires')).toBe('0')
})
test('failed verification keeps cookie writes and provider headers without leaking the token', async () => {
  state.failVerify = true
  const response = await handleAuthCallback(
    new NextRequest(
      'http://127.0.0.1:4310/ru/auth/confirm?token_hash=fixture-secret&type=signup'
    ),
    'ru',
    'confirm'
  )
  expect(response.headers.get('Location')).toBe(
    'http://127.0.0.1:4310/ru/login?error=invalidLink'
  )
  expect(response.headers.get('Location')).not.toContain('fixture-secret')
  expect(response.cookies.get('sb-test-session')?.value).toBe('fixture-session')
  expect(response.headers.get('Cache-Control')).toContain('no-store')
})
test('cross-origin and missing-origin mutations never reach the provider', async () => {
  vi.mocked(createSupabaseRequestClient).mockClear()
  for (const origin of [undefined, 'https://evil.test'])
    expect(
      (await handleAuthPost(post(origin, { locale: 'en' }), 'logout')).status
    ).toBe(403)
  expect(createSupabaseRequestClient).not.toHaveBeenCalled()
})
test('local logout expires the session cookie', async () => {
  const response = await handleAuthPost(
    post('http://127.0.0.1:4310', { locale: 'en' }),
    'logout'
  )
  expect(await response.json()).toMatchObject({ status: 'success', url: '/en' })
  expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
})

afterEach(() => vi.unstubAllEnvs())

const providerFeature = await loadFeature('tests/bdd/identity/provider.feature')
describeFeature(providerFeature, ({ Scenario }) => {
  Scenario(
    'SC-308 Disabled Google remains in the localized application',
    ({ Then }) => {
      Then(
        'disabled Google returns a safe application error before redirect',
        async () => {
          vi.stubEnv('AUTH_GOOGLE_ENABLED', 'false')
          const disabled = await handleAuthPost(
            post('http://127.0.0.1:4310', { locale: 'ru' }),
            'google'
          )
          expect(await disabled.json()).toEqual({
            status: 'error',
            error: 'unavailable',
          })
          expect(state.googleCalls).toBe(0)
          vi.stubEnv('AUTH_GOOGLE_ENABLED', 'true')
          const enabled = await handleAuthPost(
            post('http://127.0.0.1:4310', { locale: 'ru' }),
            'google'
          )
          expect(await enabled.json()).toEqual({
            status: 'success',
            url: 'http://127.0.0.1:54321/auth/v1/authorize?provider=google',
          })
          expect(state.googleCalls).toBe(1)
        }
      )
    }
  )
})
