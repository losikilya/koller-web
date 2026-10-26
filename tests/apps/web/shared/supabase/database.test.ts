import { expectTypeOf, it } from 'vitest'
import type { Database } from '@/shared/supabase/database'

it('preserves nullable usernames in both public RPC contracts', () => {
  expectTypeOf<
    Database['public']['Functions']['get_public_profile']['Returns'][number]['username']
  >().toEqualTypeOf<string | null>()
  expectTypeOf<
    Database['public']['Functions']['list_public_profiles']['Returns'][number]['username']
  >().toEqualTypeOf<string | null>()
})
