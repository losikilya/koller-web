import type { PublicProfileDto } from '@dance/contracts'
import { publicProfileSchema } from '@dance/contracts'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/supabase/database'
import { ProfileFailure } from './profileService'
export type PublicProfileReader = {
  readByUsername(username: string): Promise<unknown>
}
export function normalizedPublicUsername(value: string): string | null {
  return /^[a-z][a-z0-9_]{2,29}$/i.test(value) ? value.toLowerCase() : null
}
export function createPublicProfileReader(
  client: SupabaseClient<Database>
): PublicProfileReader {
  return {
    async readByUsername(username) {
      const result = await client.rpc('get_public_profile_by_username', {
        p_username: username,
      })
      if (result.error || !result.data || result.data.length > 1)
        throw new ProfileFailure('service_unavailable', 503)
      return result.data[0] ?? null
    },
  }
}
export async function readPublicProfile(
  reader: PublicProfileReader,
  username: string
): Promise<PublicProfileDto | null> {
  const canonical = normalizedPublicUsername(username)
  if (!canonical) return null
  try {
    const row = await reader.readByUsername(canonical)
    if (!row) return null
    if (
      typeof row !== 'object' ||
      !('username' in row) ||
      row.username !== canonical ||
      !('user_id' in row) ||
      !('display_name' in row) ||
      !('bio' in row)
    )
      throw new Error('Invalid public projection')
    return publicProfileSchema.parse({
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatarUrl: null,
    })
  } catch {
    throw new ProfileFailure('service_unavailable', 503)
  }
}
