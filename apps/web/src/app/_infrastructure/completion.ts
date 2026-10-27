import 'server-only'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/supabase/database'
import { readVerifiedUser } from '@/shared/supabase/verifiedUser'
import { readCompletion } from '@/modules/profile'
import { getSupabaseConfig } from '@/shared/supabase/config'
import { createSupabaseServerClient } from './supabase'
import { completionRedirect } from './completionPolicy'
export async function authCompletionDestination(
  client: SupabaseClient<Database>,
  locale: 'en' | 'ru',
  safeNext: string
): Promise<string> {
  const identity = await readVerifiedUser(client)
  if (!identity?.email_confirmed_at)
    throw new Error('Verified identity required')
  return (await readCompletion(client, identity.id))
    ? safeNext
    : '/' + locale + '/account/profile'
}
export async function requirePageCompletion(
  locale: 'en' | 'ru',
  path: string,
  bootstrapRecovery = false
) {
  if (
    !getSupabaseConfig() ||
    !completionRedirect(
      '/' + locale + (path === '/' ? '' : path),
      false,
      bootstrapRecovery
    )
  )
    return
  const client = await createSupabaseServerClient()
  const identity = await readVerifiedUser(client)
  if (!identity?.email_confirmed_at) return
  const target = completionRedirect(
    '/' + locale + (path === '/' ? '' : path),
    await readCompletion(client, identity.id),
    bootstrapRecovery
  )
  if (target) redirect(target)
}
