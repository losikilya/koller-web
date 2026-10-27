// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import proxy from '@/proxy'
import { requirePageCompletion } from '@/app/_infrastructure/completion'
import { handleProfileRequest } from '@/app/_infrastructure/profile'
const state = vi.hoisted(() => ({
  error: null as null | { name: string; status: number },
}))
vi.mock('next-intl/middleware', () => ({
  default: () => () => NextResponse.next(),
}))
vi.mock('@/shared/supabase/config', () => ({ getSupabaseConfig: () => ({}) }))
vi.mock('@/shared/supabase/server', () => ({
  createSupabaseRequestClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: state.error }),
    },
  }),
}))
vi.mock('@/app/_infrastructure/supabase', () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: state.error }),
    },
  }),
}))
afterEach(() => {
  state.error = null
})
test('Auth outages fail closed on gated document/RSC routes and server guards', async () => {
  for (const status of [0, 429, 503]) {
    state.error = { name: 'AuthRetryableFetchError', status }
    const response = await proxy(
      new NextRequest('http://localhost/en/playground', {
        headers: { cookie: 'sb-test-auth-token=fixture', RSC: '1' },
      })
    )
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toContain('no-store')
  }
})
test('server guard and completion-state endpoint reject unavailable identity verification', async () => {
  state.error = { name: 'AuthRetryableFetchError', status: 503 }
  await expect(requirePageCompletion('en', '/playground')).rejects.toThrow()
  const response = await handleProfileRequest(
    new NextRequest('http://localhost/api/v1/me/completion'),
    'completion-state'
  )
  expect(response.status).toBe(503)
})
test('absent and invalid sessions retain legitimate guest navigation', async () => {
  for (const error of [
    null,
    { name: 'AuthSessionMissingError', status: 400 },
    { name: 'AuthApiError', status: 401 },
  ]) {
    state.error = error
    expect(
      (await proxy(new NextRequest('http://localhost/en/playground'))).status
    ).toBe(200)
    await expect(
      requirePageCompletion('en', '/playground')
    ).resolves.toBeUndefined()
  }
})
test('Auth outages leave essential recovery routes reachable', async () => {
  state.error = { name: 'AuthRetryableFetchError', status: 503 }
  for (const path of [
    '/en/login',
    '/ru/reset-password',
    '/en/account/profile',
    '/en/account?bootstrap=retry',
  ])
    expect(
      (await proxy(new NextRequest('http://localhost' + path))).status
    ).toBe(200)
})
