'use client'

import { createBrowserClient } from '@supabase/ssr'
import { requireSupabaseConfig } from './config'
import type { Database } from './database'

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = requireSupabaseConfig()
  return createBrowserClient<Database>(url, publishableKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: url.startsWith('https:'),
    },
  })
}
