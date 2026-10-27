import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/supabase/database'
import { ProfileFailure } from './profileService'
export async function readCompletion(
  client: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const result = await client
    .from('profiles')
    .select('completed_at,deletion_requested_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (result.error) throw new ProfileFailure('service_unavailable', 503)
  if (result.data?.deletion_requested_at)
    throw new ProfileFailure('account_unavailable', 403)
  return !!result.data?.completed_at
}
