import 'server-only'
import { cookies } from 'next/headers'
import { createSupabaseRequestClient } from '@/shared/supabase/server'
import { ensureProfile } from '@/modules/identity'

export async function createSupabaseServerClient() {
  const store = await cookies()
  // Server Components cannot write cookies; the proxy owns refresh and response headers.
  return createSupabaseRequestClient({ getAll: () => store.getAll() })
}

export async function initializeVerifiedProfile() {
  return ensureProfile(await createSupabaseServerClient())
}
