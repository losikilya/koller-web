import 'server-only'
import { createServerClient } from '@supabase/ssr'
import type { CookieMethodsServer } from '@supabase/ssr'
import { requireSupabaseConfig } from './config'
import type { Database } from './database'

export function createSupabaseRequestClient(cookies: CookieMethodsServer) {
  const { url, publishableKey } = requireSupabaseConfig()
  return createServerClient<Database>(url, publishableKey, {
    cookies,
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: url.startsWith('https:'),
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  })
}
