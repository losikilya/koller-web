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
      'get_public_profile' | 'list_public_profiles'
    > & {
      get_public_profile: PublicProfileFunction<'get_public_profile'>
      list_public_profiles: PublicProfileFunction<'list_public_profiles'>
    }
  }
}
