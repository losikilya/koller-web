// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { createSupabaseRequestClient } from '@/shared/supabase/server'
import { refreshSession } from '@/shared/supabase/refreshSession'
const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@/shared/supabase/server', () => ({
  createSupabaseRequestClient: createClient,
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})
describe('session refresh composition', () => {
  it('keeps unconfigured guest routes usable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    const response = NextResponse.redirect('http://localhost/en')
    expect(
      await refreshSession(new NextRequest('http://localhost/'), () => response)
    ).toBe(response)
    expect(createClient).not.toHaveBeenCalled()
  })
  it('propagates refresh cookies, forwarded locale and private cache headers on redirects', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example')
    createClient.mockImplementation(
      (cookies: Parameters<typeof createSupabaseRequestClient>[0]) => ({
        auth: {
          getUser: async () => {
            await cookies.setAll?.(
              [
                {
                  name: 'sb-project-auth-token',
                  value: 'refreshed',
                  options: { path: '/', sameSite: 'lax', secure: true },
                },
              ],
              { 'Cache-Control': 'private, no-store', Expires: '0' }
            )
            return { data: { user: { id: 'verified-fixture' } } }
          },
        },
      })
    )
    const request = new NextRequest('https://localhost/ru', {
      headers: { cookie: 'sb-project-auth-token=old' },
    })
    const response = await refreshSession(request, (current) => {
      expect(current.cookies.get('sb-project-auth-token')?.value).toBe(
        'refreshed'
      )
      const redirect = NextResponse.redirect('https://localhost/ru/')
      redirect.headers.set(
        'x-middleware-override-headers',
        'x-next-intl-locale'
      )
      redirect.headers.set('x-middleware-request-x-next-intl-locale', 'ru')
      return redirect
    })
    expect(response.status).toBe(307)
    expect(response.cookies.get('sb-project-auth-token')?.value).toBe(
      'refreshed'
    )
    expect(response.headers.get('x-middleware-request-cookie')).toContain(
      'sb-project-auth-token=refreshed'
    )
    expect(response.headers.get('x-middleware-override-headers')).toContain(
      'x-next-intl-locale'
    )
    expect(
      response.headers.get('x-middleware-request-x-next-intl-locale')
    ).toBe('ru')
    expect(response.headers.get('cache-control')).toContain('private, no-store')
    expect(response.headers.get('expires')).toBe('0')
  })
  it('prevents caching even if an expired session produces no user and no cookie write', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example')
    createClient.mockReturnValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    })
    const response = await refreshSession(
      new NextRequest('https://localhost/en', {
        headers: { cookie: 'sb-project-auth-token=expired' },
      }),
      () => NextResponse.next()
    )
    expect(response.headers.get('cache-control')).toContain('private, no-store')
  })
})
