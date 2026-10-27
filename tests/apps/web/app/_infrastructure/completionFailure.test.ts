// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { VerifiedRequestContext } from '@/shared/supabase/refreshSession'
import proxy from '@/proxy'
const state = vi.hoisted(() => ({
  owner: true,
  completed: false,
  failed: false,
  publicFailed: false,
}))
vi.mock('next-intl/middleware', () => ({
  default: () => () => NextResponse.next(),
}))
vi.mock('@/shared/supabase/refreshSession', () => ({
  refreshSession: async (
    request: NextRequest,
    respond: (
      request: NextRequest,
      context?: VerifiedRequestContext
    ) => NextResponse | Promise<NextResponse>
  ) =>
    respond(request, {
      client: {},
      user: state.owner
        ? { id: 'fixture', email_confirmed_at: 'verified' }
        : null,
    } as unknown as VerifiedRequestContext),
}))
vi.mock('@/modules/profile', () => ({
  readCompletion: async () => {
    if (state.failed) throw new Error('secret dependency detail')
    return state.completed
  },
  createPublicProfileReader: () => ({}),
  readPublicProfile: async () => {
    if (state.publicFailed) throw new Error('private dependency detail')
    return null
  },
}))
beforeEach(() => {
  state.owner = true
  state.completed = false
  state.failed = false
  state.publicFailed = false
})
test('completion lookup failure returns unavailable rather than guest application content', async () => {
  state.failed = true
  const response = await proxy(
    new NextRequest('http://127.0.0.1:4310/en/playground')
  )
  expect(response.status).toBe(503)
  expect(response.headers.get('cache-control')).toContain('no-store')
  expect(await response.text()).not.toContain('secret')
})
test('proxy protects RSC/manual account navigation while allowing bootstrap recovery and guests', async () => {
  for (const path of ['/en/playground', '/en/account', '/ru/u/dancer']) {
    const response = await proxy(
      new NextRequest('http://127.0.0.1:4310' + path, {
        headers: { RSC: '1', 'Next-Router-Prefetch': '1' },
      })
    )
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toMatch(
      /\/(en|ru)\/account\/profile$/
    )
  }
  expect(
    (
      await proxy(
        new NextRequest('http://127.0.0.1:4310/en/account?bootstrap=retry')
      )
    ).headers.get('location')
  ).toBeNull()
  state.owner = false
  expect(
    (
      await proxy(new NextRequest('http://127.0.0.1:4310/en/playground'))
    ).headers.get('location')
  ).toBeNull()
  state.publicFailed = true
  const failed = await proxy(
    new NextRequest('http://127.0.0.1:4310/ru/u/dancer')
  )
  expect(failed.status).toBe(503)
  expect(failed.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  expect(await failed.text()).not.toContain('private dependency')
})
