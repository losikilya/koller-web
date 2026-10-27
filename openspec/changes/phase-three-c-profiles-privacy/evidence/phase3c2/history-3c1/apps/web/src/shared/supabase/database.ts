import type { Database as GeneratedDatabase } from './database.types'

type PublicProfileRow = Pick<
  GeneratedDatabase['public']['Tables']['profiles']['Row'],
  'user_id' | 'username' | 'display_name' | 'bio'
>
type PublicProfileFunction<
  Name extends 'get_public_profile' | 'list_public_profiles'
> = Omit<GeneratedDatabase['public']['Functions'][Name], 'Returns'> & {
  Returns: PublicProfileRow[]
}

// PostgreSQL RETURNS TABLE metadata loses underlying column nullability during type generation.
// Preserve nullable usernames at the SDK boundary without editing generated output.
export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Functions'> & {
    Functions: Omit<
      GeneratedDatabase['public']['Functions'],
      'get_public_profile' | 'list_public_profiles' | 'update_own_profile'
    > & {
      get_public_profile: PublicProfileFunction<'get_public_profile'>
      list_public_profiles: PublicProfileFunction<'list_public_profiles'>
      // PostgREST accepts bigint decimal strings; preserve revisions beyond JS safe integers.
      update_own_profile: Omit<
        GeneratedDatabase['public']['Functions']['update_own_profile'],
        'Args'
      > & {
        Args: {
          p_patch: GeneratedDatabase['public']['Functions']['update_own_profile']['Args']['p_patch']
          p_expected_revision: string | number
        }
      }
    }
  }
}
