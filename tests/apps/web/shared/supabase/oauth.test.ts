// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest'
import { createSupabaseRequestClient } from '@/shared/supabase/server'
import { startGoogle } from '@/modules/identity/authService'
afterEach(() => vi.unstubAllEnvs())
test('real SSR SDK generates a PKCE challenge and verifier cookie before provider redirect', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture')
  const cookies: { name: string; value: string }[] = []
  const client = createSupabaseRequestClient({
    getAll: () => cookies,
    setAll(values) {
      cookies.push(...values)
    },
  })
  const result = await startGoogle(
    client,
    'http://127.0.0.1:4310/ru/auth/callback'
  )
  expect(result.status).toBe('success')
  const destination = new URL(result.url!)
  expect(destination.origin).toBe('http://127.0.0.1:54321')
  expect(destination.searchParams.get('provider')).toBe('google')
  expect(destination.searchParams.get('code_challenge_method')).toBe('s256')
  expect(Boolean(destination.searchParams.get('code_challenge'))).toBe(true)
  expect(cookies.some((cookie) => cookie.name.endsWith('-code-verifier'))).toBe(
    true
  )
})
