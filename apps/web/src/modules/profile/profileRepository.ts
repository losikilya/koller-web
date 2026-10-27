import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/supabase/database'
import { ProfileFailure } from './profileService'
import type { ProfileRepository } from './profileService'
export function createProfileRepository(
  client: SupabaseClient<Database>
): ProfileRepository {
  return {
    async read(userId) {
      const [profile, privacy] = await Promise.all([
        client
          .from('profiles')
          .select(
            'user_id,username,display_name,bio,revision::text,updated_at,deletion_requested_at,completed_at,avatar_id'
          )
          .eq('user_id', userId)
          .maybeSingle(),
        client
          .from('profile_privacy')
          .select('visibility,discoverable,show_activity,revision::text')
          .eq('user_id', userId)
          .maybeSingle(),
      ])
      if (profile.error || privacy.error)
        throw new ProfileFailure('service_unavailable', 503)
      if (profile.data?.deletion_requested_at)
        throw new ProfileFailure('account_unavailable', 403)
      if (!profile.data || !privacy.data) return null
      const row = profile.data,
        settings = privacy.data
      if (
        (settings.visibility !== 'public' &&
          settings.visibility !== 'private') ||
        settings.show_activity !== false
      )
        throw new ProfileFailure('service_unavailable', 503)
      return {
        userId: row.user_id,
        username: row.username,
        displayName: row.display_name,
        bio: row.bio,
        revision: row.revision,
        updatedAt: row.updated_at,
        completed: row.completed_at !== null,
        avatarId: row.avatar_id,
        privacy: {
          visibility: settings.visibility,
          discoverable: settings.discoverable,
          showActivity: settings.show_activity,
          revision: settings.revision,
        },
      }
    },
    async write(_userId, patch, revision) {
      const result = await client.rpc('update_own_profile', {
        p_patch: patch,
        p_expected_revision: revision,
      })
      if (
        result.error &&
        // SQLSTATE 40001 is a definite rollback even when PostgREST returns 500.
        result.error.code !== '40001' &&
        (result.status === 0 || result.status >= 500 || !result.error.code)
      ) {
        throw new ProfileFailure('outcome_unknown', 503)
      }
      return result.error ? { code: result.error.code } : null
    },
    async complete(_userId, patch, profileRevision, privacyRevision) {
      const result = await client.rpc('complete_own_profile', {
        p_patch: patch,
        p_expected_profile_revision: profileRevision,
        p_expected_privacy_revision: privacyRevision,
      })
      if (
        result.error &&
        result.error.code !== '40001' &&
        (result.status === 0 || result.status >= 500 || !result.error.code)
      )
        throw new ProfileFailure('outcome_unknown', 503)
      return result.error ? { code: result.error.code } : null
    },
  }
}
