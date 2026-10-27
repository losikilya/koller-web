import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database'

export async function readVerifiedUser(client: SupabaseClient<Database>) {
  const { data, error } = await client.auth.getUser()
  if (error) {
    if (
      error.name === 'AuthSessionMissingError' ||
      [400, 401, 403].includes(error.status ?? 0)
    )
      return null
    throw new Error('Identity verification unavailable')
  }
  return data.user
}
