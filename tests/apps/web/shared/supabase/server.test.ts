// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseRequestClient } from '@/shared/supabase/server'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
describe('request-scoped Supabase client', () => {
  it('creates separate clients and disables caching for database fetches', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)
    const firstCookies = vi.fn(() => [{ name: 'request-a', value: 'a' }])
    const secondCookies = vi.fn(() => [{ name: 'request-b', value: 'b' }])
    const first = createSupabaseRequestClient({ getAll: firstCookies })
    const second = createSupabaseRequestClient({ getAll: secondCookies })
    expect(first).not.toBe(second)
    expect(first.auth).not.toBe(second.auth)
    await first.from('profiles').select('user_id')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ cache: 'no-store' })
    )
    expect(firstCookies).toHaveBeenCalled()
  })
})
